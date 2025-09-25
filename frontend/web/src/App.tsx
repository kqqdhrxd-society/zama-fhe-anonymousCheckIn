import React, { useEffect, useState } from "react";
import { getContractReadOnly, normAddr, ABI, config } from "./contract";
import { 
  FaClock, FaUsers, FaChartLine, FaList, 
  FaPlus, FaLock, FaEye, FaFire, 
  FaHistory, FaChartBar, FaCheckCircle
} from "react-icons/fa";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import { ethers } from "ethers";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import "./App.css"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Meeting {
  id: number;
  creator: string;
  title: string;
  startTime: number;
  endTime: number;
  maxParticipants: number;
  participantCount: number;
  status: number; // 0: ACTIVE, 1: ENDED
  duration?: number;
}

interface ParticipantInfo {
  hasCheckedIn: boolean;
  checkInTime: number;
}

export default function App() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [activeMeetings, setActiveMeetings] = useState<number[]>([]);

  useEffect(() => {
    loadMeetings().finally(() => setLoading(false));
  }, []);

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
      });
    } catch (e) {
      console.error("Failed to connect wallet", e);
      alert("Failed to connect wallet: " + e);
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  // ----------------- Load Meetings -----------------
  const loadMeetings = async () => {
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      const nextId = Number(await contract.nextMeetingId());
      const list: Meeting[] = [];
      
      // Load active meetings
      const activeMeetingIds = await contract.getActiveMeetings();
      setActiveMeetings(activeMeetingIds.map(id => Number(id)));
      
      for (let i = 1; i < nextId; i++) {
        try {
          const meetingDetails = await contract.getMeetingDetails(i);
          
          list.push({
            id: i,
            creator: meetingDetails.creator,
            title: meetingDetails.title,
            startTime: Number(meetingDetails.startTime),
            endTime: Number(meetingDetails.endTime),
            maxParticipants: Number(meetingDetails.maxParticipants),
            participantCount: Number(meetingDetails.participantCount),
            status: Number(meetingDetails.status),
            duration: meetingDetails.endTime > 0 ? 
              Number(meetingDetails.endTime) - Number(meetingDetails.startTime) : 
              Date.now()/1000 - Number(meetingDetails.startTime)
          });
        } catch (e) {
          console.error(`Failed to load meeting ${i}`, e);
          
          list.push({
            id: i,
            creator: "0x0000000000000000000000000000000000000000",
            title: "Invalid Meeting",
            startTime: 0,
            endTime: 0,
            maxParticipants: 0,
            participantCount: 0,
            status: 1, // ENDED
          });
        }
      }
      
      setMeetings(list);
    } catch (e) {
      console.error("Failed to load meetings", e);
    }
  };

  const createMeeting = async (title: string, maxParticipants: number) => {
    if (!title || maxParticipants <= 0) { 
      alert("Please enter valid meeting details"); 
      return; 
    }
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setCreating(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ABI, signer);
      
      const tx = await contract.createMeeting(
        title, 
        maxParticipants
      );
      await tx.wait();
      setShowCreateModal(false);
      await loadMeetings();
      alert("Meeting created successfully!");
    } catch (e: any) {
      alert("Creation failed: " + (e?.message || e));
    } finally {
      setCreating(false);
    }
  };

  const checkIn = async (meetingId: number, participantId: number) => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ABI, signer);
      
      const tx = await contract.checkIn(
        meetingId, 
        participantId
      );
      await tx.wait();
      setShowCheckInModal(false);
      setParticipantId("");
      await loadMeetings();
      alert("Check-in successful!");
    } catch (e: any) {
      console.error("Check-in failed", e);
      alert("Check-in failed: " + (e?.message || e));
    }
  };

  const endMeeting = async (meetingId: number) => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    if (!window.confirm("Are you sure you want to end this meeting? This will finalize attendance records.")) {
      return;
    }
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ABI, signer);
      const tx = await contract.endMeeting(meetingId);
      await tx.wait();
      await loadMeetings();
      alert("Meeting ended successfully!");
    } catch (e: any) {
      console.error("End meeting failed", e);
      alert("Failed to end meeting: " + (e?.message || e));
    }
  };

  const getParticipantInfo = async (meetingId: number, participantId: number) => {
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      const info = await contract.isParticipant(meetingId, participantId);
      setParticipantInfo({
        hasCheckedIn: info,
        checkInTime: 0 // Not available in simplified contract
      });
    } catch (e: any) {
      alert("Failed to get participant info: " + (e?.message || e));
    }
  };

  const openCheckInModal = (meeting: Meeting) => {
    setCurrentMeeting(meeting);
    setShowCheckInModal(true);
    setParticipantInfo(null);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading blockchain data...</p>
    </div>
  );

  // Filter meetings based on active tab
  const filteredMeetings = meetings.filter(meeting => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return meeting.status === 0; // ACTIVE
    if (activeTab === "completed") return meeting.status === 1; // ENDED
    return true;
  });

  // ----------------- Aggregate Stats -----------------
  const totalMeetings = meetings.length;
  const totalParticipants = meetings.reduce((sum, m) => sum + m.participantCount, 0);
  const activeMeetingCount = meetings.filter(m => m.status === 0).length;

  // Chart data for meeting stats
  const chartData = {
    labels: meetings.slice(0, 5).map(m => m.title),
    datasets: [
      {
        label: 'Participants',
        data: meetings.slice(0, 5).map(m => m.participantCount),
        backgroundColor: 'rgba(138, 43, 226, 0.6)',
        borderColor: 'rgba(138, 43, 226, 1)',
        borderWidth: 1,
      },
      {
        label: 'Max Capacity',
        data: meetings.slice(0, 5).map(m => m.maxParticipants),
        backgroundColor: 'rgba(0, 191, 255, 0.6)',
        borderColor: 'rgba(0, 191, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="app-container">
      {/* Animated background elements */}
      <div className="bg-particles">
        {[...Array(15)].map((_, i) => <div key={i} className="particle"></div>)}
      </div>

      {/* Navbar */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>Anon<span>CheckIn</span></h1>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="create-auction-btn"
          >
            <FaPlus /> New Meeting
          </button>
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Dashboard Section */}
        <section className="dashboard-section">
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>Total Participants</h3>
                <p>{totalParticipants}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FaList />
              </div>
              <div className="stat-content">
                <h3>Total Meetings</h3>
                <p>{totalMeetings}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FaFire />
              </div>
              <div className="stat-content">
                <h3>Active Meetings</h3>
                <p>{activeMeetingCount}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3>Avg. Participants</h3>
                <p>{totalMeetings > 0 ? (totalParticipants / totalMeetings).toFixed(1) : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-chart">
            <h2>
              <FaChartLine /> Meeting Statistics
            </h2>
            <div className="chart-container">
              <Bar data={chartData} options={{ 
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: '#fff'
                    }
                  },
                  title: {
                    display: true,
                    text: 'Recent Meetings',
                    color: '#fff'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: '#aaa'
                    },
                    grid: {
                      color: 'rgba(255,255,255,0.1)'
                    }
                  },
                  x: {
                    ticks: {
                      color: '#aaa'
                    },
                    grid: {
                      color: 'rgba(255,255,255,0.1)'
                    }
                  }
                }
              }} />
            </div>
          </div>
        </section>
        
        {/* Popular Meetings Section */}
        <section className="hot-auctions">
          <div className="section-header">
            <h2><FaFire /> Popular Meetings</h2>
            <p>Most active meetings with highest participation</p>
          </div>
          
          <div className="hot-auctions-grid">
            {meetings
              .filter(m => m.status === 0) // Only active meetings
              .sort((a, b) => b.participantCount - a.participantCount)
              .slice(0, 3)
              .map(meeting => (
                <div key={meeting.id} className="hot-auction-card">
                  <div className="hot-auction-header">
                    <h3>{meeting.title}</h3>
                    <span className="hot-badge">HOT</span>
                  </div>
                  <p className="hot-auction-desc">
                    {meeting.participantCount}/{meeting.maxParticipants} participants
                  </p>
                  <div className="hot-auction-stats">
                    <div className="hot-stat">
                      <span>Duration</span>
                      <strong>{meeting.duration ? Math.floor(meeting.duration) : 0} seconds</strong>
                    </div>
                    <div className="hot-stat">
                      <span>Status</span>
                      <strong>
                        {meeting.status === 0 ? "Active" : "Ended"}
                      </strong>
                    </div>
                  </div>
                  <button 
                    onClick={() => openCheckInModal(meeting)} 
                    className="bid-hot-btn"
                  >
                    Check In
                  </button>
                </div>
              ))
            }
          </div>
        </section>
        
        {/* Meeting Tabs */}
        <div className="auction-tabs">
          {[
            { id: "all", label: "All Meetings", icon: <FaList /> },
            { id: "active", label: "Active", icon: <FaFire /> },
            { id: "completed", label: "Completed", icon: <FaHistory /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        {/* Meetings Grid */}
        <div className="auctions-grid">
          {filteredMeetings.length === 0 ? (
            <div className="no-auctions">
              <h3>No meetings found</h3>
              <p>Create the first meeting to get started!</p>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="create-first-btn"
              >
                Create First Meeting
              </button>
            </div>
          ) : (
            filteredMeetings.map(meeting => {
              const isCreator = account && normAddr(account) === normAddr(meeting.creator);
              const isActive = meeting.status === 0;
              const isEnded = meeting.status === 1;
              
              return (
                <div key={meeting.id} className="auction-card">
                  <div className="auction-header">
                    <div>
                      <h3>{meeting.title}</h3>
                      <p className="creator">
                        by {meeting.creator.substring(0, 6)}...{meeting.creator.substring(meeting.creator.length - 4)}
                      </p>
                    </div>
                    <div className={`status-badge ${isEnded ? 'completed' : 'active'}`}>
                      {isEnded ? "ENDED" : "ACTIVE"}
                    </div>
                  </div>
                  
                  <div className="auction-stats">
                    <div className="stat">
                      <FaClock size={14} />
                      <span>Started: {new Date(meeting.startTime * 1000).toLocaleString()}</span>
                    </div>
                    {isEnded && (
                      <div className="stat">
                        <FaClock size={14} />
                        <span>Ended: {new Date(meeting.endTime * 1000).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="stat">
                      <FaUsers size={14} />
                      <span>{meeting.participantCount}/{meeting.maxParticipants} participants</span>
                    </div>
                    {meeting.duration && (
                      <div className="stat">
                        <FaClock size={14} />
                        <span>Duration: {Math.floor(meeting.duration)} seconds</span>
                      </div>
                    )}
                  </div>
                  
                  {isEnded && (
                    <div className="winner-info">
                      <FaCheckCircle />
                      <div>
                        <span>Meeting completed</span>
                        <strong>{meeting.participantCount} participants</strong>
                      </div>
                    </div>
                  )}
                  
                  <div className="auction-actions">
                    {isActive && account && (
                      <button 
                        onClick={() => openCheckInModal(meeting)} 
                        className="bid-btn"
                      >
                        Check In
                      </button>
                    )}
                    
                    {isCreator && isActive && (
                      <button 
                        onClick={() => endMeeting(meeting.id)}
                        className="terminate-btn"
                      >
                        <FaLock size={12} /> End Meeting
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <ModalCreate 
          onCreate={createMeeting} 
          onClose={() => setShowCreateModal(false)} 
          creating={creating} 
        />
      )}
      
      {showCheckInModal && currentMeeting && (
        <ModalCheckIn 
          meeting={currentMeeting}
          onCheckIn={(id) => checkIn(currentMeeting.id, id)}
          onClose={() => setShowCheckInModal(false)}
          participantId={participantId}
          setParticipantId={setParticipantId}
          participantInfo={participantInfo}
          getParticipantInfo={() => getParticipantInfo(currentMeeting.id, parseInt(participantId))}
        />
      )}
      
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}

      <footer className="app-footer">
        <p>Anonymous CheckIn System &copy; {new Date().getFullYear()} - Built on Ethereum</p>
        <div className="footer-links">
          <a href="#">Docs</a>
          <a href="#">GitHub</a>
          <a href="#">Twitter</a>
          <a href="#">Discord</a>
        </div>
      </footer>
    </div>
  );
}

// ------------------- Create Meeting Modal -------------------
function ModalCreate({ onCreate, onClose, creating }: { 
  onCreate: (title: string, maxParticipants: number) => void; 
  onClose: () => void; 
  creating: boolean; 
}) {
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);

  const handleSubmit = () => {
    if (!title || maxParticipants <= 0) {
      alert("Please fill all fields with valid values");
      return;
    }
    onCreate(title, maxParticipants);
  };

  return (
    <div className="modal-overlay">
      <div className="create-modal">
        <div className="modal-header">
          <h2>Create New Meeting</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Meeting Title</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Meeting title" 
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Max Participants</label>
            <input 
              type="number" 
              value={maxParticipants} 
              onChange={e => setMaxParticipants(parseInt(e.target.value))} 
              min="1"
              className="form-input"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={creating}
            className="create-btn"
          >
            {creating ? "Creating..." : "Create Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------- Check-in Modal -------------------
function ModalCheckIn({ 
  meeting, 
  onCheckIn, 
  onClose, 
  participantId, 
  setParticipantId,
  participantInfo,
  getParticipantInfo
}: { 
  meeting: Meeting;
  onCheckIn: (id: number) => void;
  onClose: () => void;
  participantId: string;
  setParticipantId: React.Dispatch<React.SetStateAction<string>>;
  participantInfo: ParticipantInfo | null;
  getParticipantInfo: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="bid-modal">
        <div className="modal-header">
          <h2>Check In to {meeting.title}</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="auction-info">
            <div className="meeting-stats">
              <div className="stat">
                <FaUsers size={14} />
                <span>{meeting.participantCount}/{meeting.maxParticipants} participants</span>
              </div>
              {meeting.duration && (
                <div className="stat">
                  <FaClock size={14} />
                  <span>Duration: {Math.floor(meeting.duration)} seconds</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Your Participant ID</label>
            <div className="input-with-button">
              <input 
                type="number" 
                value={participantId} 
                onChange={e => setParticipantId(e.target.value)} 
                placeholder="Enter unique participant ID" 
                className="form-input"
              />
              <button 
                onClick={getParticipantInfo}
                disabled={!participantId}
                className="check-status-btn"
              >
                Check Status
              </button>
            </div>
            <p className="input-note">
              This should be a unique number that identifies you anonymously
            </p>
          </div>
          
          {participantInfo && (
            <div className="participant-info">
              {participantInfo.hasCheckedIn ? (
                <div className="already-checked-in">
                  <FaCheckCircle size={24} />
                  <div>
                    <h3>Already Checked In</h3>
                    <p>You have already checked in to this meeting</p>
                  </div>
                </div>
              ) : (
                <div className="not-checked-in">
                  <FaEye size={24} />
                  <div>
                    <h3>Not Checked In</h3>
                    <p>You can check in now</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button 
            onClick={() => onCheckIn(parseInt(participantId))}
            disabled={!participantId || (participantInfo?.hasCheckedIn ?? false)}
            className="bid-btn"
          >
            Check In
          </button>
        </div>
      </div>
    </div>
  );
}