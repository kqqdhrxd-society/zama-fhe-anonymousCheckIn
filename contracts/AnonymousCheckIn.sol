// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AnonymousCheckIn {
    // Meeting status enum
    enum MeetingStatus { ACTIVE, ENDED }
    
    // Meeting structure
    struct Meeting {
        address creator;
        string title;                   // Meeting title/description
        uint256 startTime;
        uint256 endTime;
        uint256 maxParticipants;
        uint256 participantCount;
        MeetingStatus status;
        mapping(uint256 => bool) participants; // Track participant IDs
        uint256[] participantIds;      // Track all participant IDs for iteration
    }
    
    // Contract state variables
    mapping(uint256 => Meeting) public meetings;
    mapping(address => uint256[]) public userMeetings; // Meetings created by user
    mapping(uint256 => mapping(uint256 => bool)) public usedParticipantIds; // Prevent ID reuse in same meeting
    
    uint256 public nextMeetingId = 1;
    
    // Events
    event MeetingCreated(uint256 indexed meetingId, address creator, string title, uint256 maxParticipants);
    event CheckedIn(uint256 indexed meetingId, uint256 participantId, address participantAddress, uint256 timestamp);
    event MeetingEnded(uint256 indexed meetingId, uint256 duration, uint256 participantCount);
    
    modifier meetingExists(uint256 _meetingId) {
        require(_meetingId > 0 && _meetingId < nextMeetingId, "Meeting does not exist");
        _;
    }
    
    modifier onlyCreator(uint256 _meetingId) {
        require(meetings[_meetingId].creator == msg.sender, "Only meeting creator can call this");
        _;
    }
    
    // Create a new meeting
    function createMeeting(
        string memory _title,
        uint256 _maxParticipants
    ) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_maxParticipants > 0, "Max participants must be > 0");
        
        uint256 meetingId = nextMeetingId++;
        Meeting storage newMeeting = meetings[meetingId];
        
        newMeeting.creator = msg.sender;
        newMeeting.title = _title;
        newMeeting.startTime = block.timestamp;
        newMeeting.maxParticipants = _maxParticipants;
        newMeeting.status = MeetingStatus.ACTIVE;
        
        userMeetings[msg.sender].push(meetingId);
        
        emit MeetingCreated(meetingId, msg.sender, _title, _maxParticipants);
    }
    
    // Check into a meeting
    function checkIn(uint256 _meetingId, uint256 _participantId) external meetingExists(_meetingId) {
        Meeting storage meeting = meetings[_meetingId];
        
        require(meeting.status == MeetingStatus.ACTIVE, "Meeting not active");
        require(block.timestamp >= meeting.startTime, "Meeting not started yet");
        require(!meeting.participants[_participantId], "Already checked in");
        require(!usedParticipantIds[_meetingId][_participantId], "Participant ID already used");
        require(meeting.participantCount < meeting.maxParticipants, "Meeting full");
        
        meeting.participants[_participantId] = true;
        meeting.participantIds.push(_participantId);
        meeting.participantCount++;
        usedParticipantIds[_meetingId][_participantId] = true;
        
        emit CheckedIn(_meetingId, _participantId, msg.sender, block.timestamp);
    }
    
    // End meeting
    function endMeeting(uint256 _meetingId) external meetingExists(_meetingId) onlyCreator(_meetingId) {
        Meeting storage meeting = meetings[_meetingId];
        require(meeting.status == MeetingStatus.ACTIVE, "Meeting not active");
        
        meeting.endTime = block.timestamp;
        meeting.status = MeetingStatus.ENDED;
        
        uint256 duration = meeting.endTime - meeting.startTime;
        
        emit MeetingEnded(_meetingId, duration, meeting.participantCount);
    }
    
    // Frontend helper functions
    function getMeetingDetails(uint256 _meetingId) external view meetingExists(_meetingId) returns (
        address creator,
        string memory title,
        uint256 startTime,
        uint256 endTime,
        uint256 maxParticipants,
        uint256 participantCount,
        MeetingStatus status
    ) {
        Meeting storage meeting = meetings[_meetingId];
        return (
            meeting.creator,
            meeting.title,
            meeting.startTime,
            meeting.endTime,
            meeting.maxParticipants,
            meeting.participantCount,
            meeting.status
        );
    }
    
    function isParticipant(uint256 _meetingId, uint256 _participantId) external view returns (bool) {
        return meetings[_meetingId].participants[_participantId];
    }
    
    function getMeetingParticipants(uint256 _meetingId) external view returns (uint256[] memory) {
        return meetings[_meetingId].participantIds;
    }
    
    function getUserMeetings(address _user) external view returns (uint256[] memory) {
        return userMeetings[_user];
    }
    
    function getActiveMeetings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // First pass: count active meetings
        for (uint256 i = 1; i < nextMeetingId; i++) {
            if (meetings[i].status == MeetingStatus.ACTIVE) {
                activeCount++;
            }
        }
        
        // Second pass: collect active meeting IDs
        uint256[] memory activeMeetings = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < nextMeetingId; i++) {
            if (meetings[i].status == MeetingStatus.ACTIVE) {
                activeMeetings[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeMeetings;
    }
}