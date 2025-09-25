// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ZamaFheCheckIn is SepoliaConfig {
    enum MeetingStatus { ACTIVE, ENDED }
    
    struct Meeting {
        address creator;
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 maxParticipants;
        MeetingStatus status;
        uint256 checkInFee;
        
        // Encrypted state variables
        euint32 encryptedParticipantCount;
        euint32 encryptedTotalFees;
        
        // Decrypted values (after meeting ends)
        uint32 decryptedParticipantCount;
        uint32 decryptedTotalFees;
    }
    
    // Participant status tracking
    struct ParticipantStatus {
        euint32 encryptedCheckInCount; // 0 = not checked in, 1 = checked in
    }
    
    // Contract state
    mapping(uint256 => Meeting) public meetings;
    mapping(address => uint256) public meetingsCreated;
    mapping(uint256 => mapping(address => ParticipantStatus)) public participantStatus;
    
    uint256 public nextMeetingId = 1;
    address public admin;
    uint256 public minimumCheckInFee = 0.001 ether;
    uint256 public maximumMeetingDuration = 7 days;
    
    // Request ID mapping
    mapping(uint256 => uint256) private requestToMeetingPlusOne;
    
    // Events
    event MeetingCreated(uint256 indexed meetingId, address creator, string title, uint256 maxParticipants, uint256 checkInFee);
    event CheckedIn(uint256 indexed meetingId, address participantAddress, uint256 timestamp);
    event MeetingEnded(uint256 indexed meetingId, uint256 duration, uint32 participantCount, uint32 totalFees);
    event MeetingStatsDecrypted(uint256 indexed meetingId, uint32 participantCount, uint32 totalFees);
    event CheckInStatusDecrypted(uint256 indexed meetingId, address participant, bool isCheckedIn);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier meetingExists(uint256 _meetingId) {
        require(_meetingId > 0 && _meetingId < nextMeetingId, "Invalid meeting");
        _;
    }
    
    modifier onlyCreator(uint256 _meetingId) {
        require(meetings[_meetingId].creator == msg.sender, "Only creator");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    // Create meeting with encrypted counters
    function createMeeting(
        string memory _title,
        uint256 _maxParticipants,
        uint256 _checkInFee,
        uint256 _duration
    ) external payable {
        require(bytes(_title).length > 0, "Title required");
        require(_maxParticipants > 0, "Participants required");
        require(_duration <= maximumMeetingDuration, "Duration exceeded");
        require(_checkInFee >= minimumCheckInFee, "Fee too low");
        require(msg.value >= _checkInFee * _maxParticipants, "Insufficient deposit");
        
        uint256 meetingId = nextMeetingId++;
        Meeting storage newMeeting = meetings[meetingId];
        
        newMeeting.creator = msg.sender;
        newMeeting.title = _title;
        newMeeting.startTime = block.timestamp;
        newMeeting.maxParticipants = _maxParticipants;
        newMeeting.checkInFee = _checkInFee;
        newMeeting.status = MeetingStatus.ACTIVE;
        
        // Initialize encrypted counters
        newMeeting.encryptedParticipantCount = FHE.asEuint32(0);
        newMeeting.encryptedTotalFees = FHE.asEuint32(0);
        
        meetingsCreated[msg.sender]++;
        
        emit MeetingCreated(meetingId, msg.sender, _title, _maxParticipants, _checkInFee);
    }
    
    // Encrypted check-in function
    function checkIn(uint256 _meetingId) external payable meetingExists(_meetingId) {
        Meeting storage meeting = meetings[_meetingId];
        
        require(meeting.status == MeetingStatus.ACTIVE, "Meeting inactive");
        require(block.timestamp >= meeting.startTime, "Not started");
        require(msg.value >= meeting.checkInFee, "Insufficient fee");
        
        // Initialize participant status if not exists
        ParticipantStatus storage status = participantStatus[_meetingId][msg.sender];
        if (FHE.isInitialized(status.encryptedCheckInCount) == false) {
            status.encryptedCheckInCount = FHE.asEuint32(0);
        }
        
        // Update encrypted state
        meeting.encryptedParticipantCount = FHE.add(meeting.encryptedParticipantCount, FHE.asEuint32(1));
        meeting.encryptedTotalFees = FHE.add(
            meeting.encryptedTotalFees, 
            FHE.asEuint32(uint32(meeting.checkInFee))
        );
        
        // Set check-in status to encrypted true (1)
        status.encryptedCheckInCount = FHE.asEuint32(1);
        
        // Allow contract to decrypt these values in the future
        FHE.allowThis(meeting.encryptedParticipantCount);
        FHE.allowThis(meeting.encryptedTotalFees);
        FHE.allowThis(status.encryptedCheckInCount);
        
        emit CheckedIn(_meetingId, msg.sender, block.timestamp);
    }
    
    // Function to request decryption of participant status
    function requestCheckInStatus(uint256 _meetingId) external meetingExists(_meetingId) {
        ParticipantStatus storage status = participantStatus[_meetingId][msg.sender];
        require(FHE.isInitialized(status.encryptedCheckInCount), "No status record");
        
        // Prepare encrypted data for decryption
        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(status.encryptedCheckInCount);
        
        // Request decryption
        uint256 reqId = FHE.requestDecryption(ciphertexts, this.callbackCheckInStatus.selector);
        requestToMeetingPlusOne[reqId] = _meetingId + 1;
    }
    
    // Callback for decrypted participant status
    function callbackCheckInStatus(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 stored = requestToMeetingPlusOne[requestId];
        require(stored != 0, "Invalid request");
        uint256 meetingId = stored - 1;
        
        // Verify decryption proof
        FHE.checkSignatures(requestId, cleartexts, proof);
        
        // Process decrypted values
        uint32[] memory results = abi.decode(cleartexts, (uint32[]));
        bool isCheckedIn = results[0] > 0;
        
        emit CheckInStatusDecrypted(meetingId, msg.sender, isCheckedIn);
    }
    
    // End meeting and request decryption
    function endMeeting(uint256 _meetingId) external meetingExists(_meetingId) onlyCreator(_meetingId) {
        Meeting storage meeting = meetings[_meetingId];
        require(meeting.status == MeetingStatus.ACTIVE, "Not active");
        
        meeting.endTime = block.timestamp;
        meeting.status = MeetingStatus.ENDED;
        
        // Prepare encrypted data for decryption
        bytes32[] memory ciphertexts = new bytes32[](2);
        ciphertexts[0] = FHE.toBytes32(meeting.encryptedParticipantCount);
        ciphertexts[1] = FHE.toBytes32(meeting.encryptedTotalFees);
        
        // Request decryption
        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptMeetingStats.selector);
        requestToMeetingPlusOne[reqId] = _meetingId + 1;
    }
    
    // Callback for decrypted meeting stats
    function decryptMeetingStats(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 stored = requestToMeetingPlusOne[requestId];
        require(stored != 0, "Invalid request");
        uint256 meetingId = stored - 1;
        
        Meeting storage meeting = meetings[meetingId];
        require(meeting.status == MeetingStatus.ENDED, "Meeting not ended");
        
        // Verify decryption proof
        FHE.checkSignatures(requestId, cleartexts, proof);
        
        // Process decrypted values
        uint32[] memory results = abi.decode(cleartexts, (uint32[]));
        meeting.decryptedParticipantCount = results[0];
        meeting.decryptedTotalFees = results[1];
        
        // Distribute funds (simplified)
        uint256 platformFee = meeting.decryptedTotalFees / 20;
        uint256 creatorAmount = meeting.decryptedTotalFees - platformFee;
        payable(meeting.creator).transfer(creatorAmount);
        
        emit MeetingStatsDecrypted(meetingId, results[0], results[1]);
        emit MeetingEnded(
            meetingId, 
            meeting.endTime - meeting.startTime,
            meeting.decryptedParticipantCount,
            meeting.decryptedTotalFees
        );
    }
    
    // Admin functions
    function setMinimumFee(uint256 _newFee) external onlyAdmin {
        minimumCheckInFee = _newFee;
    }
    
    function setMaximumDuration(uint256 _newDuration) external onlyAdmin {
        maximumMeetingDuration = _newDuration;
    }
    
    function withdrawFees() external onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }
}