import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Bell, 
  User as UserIcon, 
  Settings, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight,
  Hospital,
  Stethoscope,
  ShieldCheck,
  Globe,
  Smartphone,
  Info,
  Calendar,
  Plus,
  History,
  Phone,
  Mail,
  MapPin,
  Heart,
  UserPlus,
  LogOut,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { Test, UserRole, Appointment, PatientProfile, User as AppUser, MedicalHistoryEntry } from './types';
import { explainTest, suggestStaffAction } from './services/geminiService';
import { auth, db, loginWithGoogle, logout, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, collection, query, where, addDoc } from 'firebase/firestore';

// --- Components ---

const StatusBadge = ({ status }: { status: Test['status'] | Appointment['status'] }) => {
  const styles = {
    "Results ready": "status-ready",
    "In progress": "status-progress",
    "Pending": "status-pending",
    "Delayed": "status-delayed",
    "Upcoming": "bg-blue-100 text-blue-700 border-blue-200",
    "Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Cancelled": "bg-rose-100 text-rose-700 border-rose-200"
  };
  
  const icons = {
    "Results ready": <CheckCircle2 className="w-3 h-3 mr-1" />,
    "In progress": <Clock className="w-3 h-3 mr-1" />,
    "Pending": <Activity className="w-3 h-3 mr-1" />,
    "Delayed": <AlertCircle className="w-3 h-3 mr-1" />,
    "Upcoming": <Calendar className="w-3 h-3 mr-1" />,
    "Completed": <CheckCircle2 className="w-3 h-3 mr-1" />,
    "Cancelled": <AlertCircle className="w-3 h-3 mr-1" />
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center border ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]}
      {status}
    </span>
  );
};

// --- Views ---

const LandingPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-fasil-teal text-white overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fasil-accent/20 rounded-full blur-3xl pointer-events-none" />
      
      <nav className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-white text-fasil-teal p-1.5 rounded-lg font-bold text-xl">FC</div>
          <span className="text-2xl font-bold tracking-tight">FasilCare</span>
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-medium opacity-80">
          <a href="#" className="hover:opacity-100 transition-opacity">How it works</a>
          <a href="#" className="hover:opacity-100 transition-opacity">For hospitals</a>
          <a href="#" className="hover:opacity-100 transition-opacity">About</a>
        </div>
        <button 
          onClick={onLogin}
          className="bg-[#141414] text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-black transition-colors shadow-lg"
        >
          Sign In
        </button>
      </nav>

      <main className="container mx-auto px-6 pt-20 pb-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-6 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Public hospitals · Mauritius</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
              Your hospital tests, tracked in real-time
            </h1>
            <p className="text-xl opacity-80 mb-10 leading-relaxed max-w-xl">
              FasilCare sends automatic SMS updates when your scan is scheduled, results are ready, or you need to return. No app download required.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={onLogin}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-xl hover:scale-105"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-12">
              <div>
                <div className="text-4xl font-bold mb-1">60%</div>
                <div className="text-xs opacity-60 uppercase tracking-wider">hospitals affected</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">SMS</div>
                <div className="text-xs opacity-60 uppercase tracking-wider">no app needed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">0</div>
                <div className="text-xs opacity-60 uppercase tracking-wider">download required</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="bg-fasil-teal-dark rounded-3xl p-8 shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="text-sm font-bold opacity-60">FasilCare — Your test updates</div>
                <Smartphone className="w-5 h-5 opacity-40" />
              </div>
              
              <div className="space-y-4">
                <div className="bg-emerald-900/40 border border-emerald-500/30 p-4 rounded-2xl">
                  <p className="text-sm leading-relaxed">
                    Your blood test results are ready. Return to SSRN Hospital, Room 4, 8am-12pm. Ref: VH-0312
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <p className="text-sm leading-relaxed opacity-80">
                    Chest X-ray scheduled Tuesday 25 March at 10:00am. Arrive 15 mins early.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-1/2 -right-6 -translate-y-1/2 bg-[#141414] text-white p-4 rounded-2xl shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </motion.div>
        </div>
      </main>
      
      <footer className="absolute bottom-8 left-0 right-0 text-center text-xs opacity-40">
        Presented by EL GROUP 1 · African Leadership College · Mauritius · 2026
      </footer>
    </div>
  );
};

const RoleSelection = ({ onSelect }: { onSelect: (role: UserRole) => void }) => {
  return (
    <div className="min-h-screen bg-fasil-teal flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to FasilCare</h2>
        <p className="text-slate-500 mb-8">Please select your role to continue</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => onSelect('patient')}
            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center space-x-4 hover:border-fasil-teal hover:bg-fasil-mint/20 transition-all group"
          >
            <div className="bg-fasil-teal text-white p-3 rounded-xl group-hover:scale-110 transition-transform">
              <UserIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900">I am a Patient</div>
              <div className="text-xs text-slate-500">Track my tests and appointments</div>
            </div>
          </button>
          
          <button 
            onClick={() => onSelect('staff')}
            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center space-x-4 hover:border-fasil-teal hover:bg-fasil-mint/20 transition-all group"
          >
            <div className="bg-fasil-teal text-white p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900">I am Healthcare Staff</div>
              <div className="text-xs text-slate-500">Manage patient tests and SMS alerts</div>
            </div>
          </button>
        </div>
        
        <button 
          onClick={() => logout()}
          className="mt-8 text-sm text-slate-400 hover:text-rose-500 font-medium flex items-center justify-center mx-auto"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </button>
      </motion.div>
    </div>
  );
};

const PatientPortal = ({ user }: { user: AppUser }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'appointments' | 'profile' | 'visits'>('tests');
  const [tests, setTests] = useState<Test[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHistoryLog, setShowHistoryLog] = useState(false);
  const [newMedicalItem, setNewMedicalItem] = useState({ type: 'illnesses' as keyof PatientProfile['medicalHistory'], content: '' });

  useEffect(() => {
    if (!user.uid) return;

    setLoading(true);
    
    // Real-time tests
    const testsQuery = query(collection(db, 'tests'), where('patientId', '==', user.patientId || user.uid));
    const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
      setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tests'));

    // Real-time appointments
    const appointmentsQuery = query(collection(db, 'appointments'), where('patientId', '==', user.patientId || user.uid));
    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'appointments'));

    // Profile
    const profileRef = doc(db, 'profiles', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as PatientProfile);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `profiles/${user.uid}`));

    return () => {
      unsubscribeTests();
      unsubscribeAppointments();
      unsubscribeProfile();
    };
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedProfile = {
      ...profile,
      phone: formData.get('phone'),
      address: formData.get('address'),
      dateOfBirth: formData.get('dob'),
      primaryPhysician: formData.get('physician'),
      emergencyContact: {
        name: formData.get('emergencyName'),
        relationship: formData.get('emergencyRelation'),
        phone: formData.get('emergencyPhone'),
      }
    };

    try {
      await updateDoc(doc(db, 'profiles', user.uid), updatedProfile);
      toast.success('Profile updated successfully');
      setShowEditProfile(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleExplain = async (type: string) => {
    setExplaining(type);
    const text = await explainTest(type);
    setExplanation(text);
  };

  const handleAddMedicalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newMedicalItem.content.trim()) return;

    const entry: MedicalHistoryEntry = {
      item: newMedicalItem.content.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedHistory = {
      ...profile.medicalHistory,
      [newMedicalItem.type]: [...(profile.medicalHistory[newMedicalItem.type] || []), entry]
    };

    try {
      await updateDoc(doc(db, 'profiles', user.uid), { medicalHistory: updatedHistory });
      setNewMedicalItem({ ...newMedicalItem, content: '' });
      toast.success('Medical history updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const getChronologicalLog = () => {
    if (!profile) return [];
    const log: { type: string; item: string; timestamp: string }[] = [];
    
    Object.entries(profile.medicalHistory).forEach(([type, entries]) => {
      (entries as any[]).forEach((entry: any) => {
        log.push({
          type: type === 'illnesses' ? 'Illness' : type === 'surgeries' ? 'Surgery' : 'Condition',
          item: typeof entry === 'string' ? entry : entry.item,
          timestamp: typeof entry === 'string' ? profile.createdAt || new Date().toISOString() : entry.timestamp
        });
      });
    });

    return log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const bookAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newApt = {
      patientId: user.patientId || user.uid,
      doctorName: formData.get('doctor'),
      department: formData.get('department'),
      date: formData.get('date'),
      time: formData.get('time'),
      reason: formData.get('reason'),
      status: 'Upcoming',
      reminderSent: false,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'appointments'), newApt);
      toast.success('Appointment booked successfully', {
        description: `Scheduled for ${newApt.date} at ${newApt.time}`
      });
      setShowBooking(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-bottom border-slate-100 flex items-center space-x-2">
          <div className="bg-fasil-teal text-white p-1 rounded font-bold text-sm">FC</div>
          <span className="font-bold text-fasil-teal">FasilCare</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button 
            onClick={() => setActiveTab('tests')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tests' ? 'bg-fasil-mint text-fasil-teal' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Activity className="w-4 h-4" />
            <span>My tests</span>
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'appointments' ? 'bg-fasil-mint text-fasil-teal' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments</span>
          </button>
          <button 
            onClick={() => setActiveTab('visits')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'visits' ? 'bg-fasil-mint text-fasil-teal' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History className="w-4 h-4" />
            <span>Visit Log</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-fasil-mint text-fasil-teal' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My profile</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>SMS history</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-fasil-teal rounded-full flex items-center justify-center text-white font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-sm font-bold">{user.name}</div>
                <div className="text-xs text-slate-400">{user.patientId || 'Patient'}</div>
              </div>
            </div>
            <button onClick={() => logout()} className="mt-4 text-xs text-slate-400 hover:text-fasil-teal flex items-center">
              <LogOut className="w-3 h-3 mr-1" /> Log out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                {activeTab === 'tests' ? `Good morning, ${user.name.split(' ')[0]}` : activeTab === 'appointments' ? 'My Schedule' : activeTab === 'visits' ? 'Visit History' : 'My Profile'}
              </h2>
              <p className="text-slate-500">Monday, 23 March 2026 · SSRN Hospital</p>
            </div>
          <div className="flex space-x-2">
            {activeTab === 'appointments' && (
              <button 
                onClick={() => setShowBooking(true)}
                className="bg-fasil-teal text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-sm hover:bg-fasil-teal-dark transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> Book Appointment
              </button>
            )}
            {activeTab === 'profile' && (
              <button 
                onClick={() => setShowEditProfile(true)}
                className="bg-fasil-teal text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-sm hover:bg-fasil-teal-dark transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" /> Edit Profile
              </button>
            )}
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'tests' && (
            <motion.div 
              key="tests-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Action Alert */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start space-x-3">
                <div className="bg-emerald-500 p-1 rounded-full text-white mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">Action needed</h4>
                  <p className="text-emerald-700 text-sm">Your blood test results are ready. Return to SSRN Hospital, Room 4, between 8am–12pm.</p>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl" />)}
                  </div>
                ) : (
                  tests.map(test => (
                    <div key={test.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{test.type}</h3>
                          <p className="text-sm text-slate-500">Requested {new Date(test.requestedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · Ref {test.id}</p>
                        </div>
                        <StatusBadge status={test.status} />
                      </div>
                      <div className="mb-6">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>Progress</span>
                          <span>{test.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${test.progress}%` }}
                            className={`h-full ${test.status === 'Delayed' ? 'bg-rose-500' : 'bg-fasil-teal'}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-4 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Hospital className="w-4 h-4 mr-1.5 opacity-40" />
                            {test.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 opacity-40" />
                            {test.timeSlot}
                          </div>
                        </div>
                        <button onClick={() => handleExplain(test.type)} className="text-fasil-teal text-sm font-bold flex items-center hover:underline">
                          <Info className="w-4 h-4 mr-1" /> What is this?
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div 
              key="appointments-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                  <div className="animate-pulse space-y-4 col-span-2">
                    {[1, 2].map(i => <div key={i} className="h-40 bg-slate-200 rounded-xl" />)}
                  </div>
                ) : (
                  appointments.map(apt => (
                    <div key={apt.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                      {apt.reminderSent && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold flex items-center">
                          <Bell className="w-3 h-3 mr-1" /> Reminder Sent
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{apt.doctorName}</h3>
                          <p className="text-sm text-fasil-teal font-medium">{apt.department}</p>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          {new Date(apt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          {apt.time}
                        </div>
                      </div>
                      {apt.reason && (
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 border border-slate-100">
                          <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Reason for visit</span>
                          {apt.reason}
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">Reschedule</button>
                        <button className="flex-1 border border-slate-200 text-slate-400 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'visits' && (
            <motion.div 
              key="visits-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Appointment History</h3>
                  <div className="text-xs text-slate-400">Chronological log of all recorded visits</div>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading visit log...</div>
                  ) : appointments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No visit history found.</p>
                    </div>
                  ) : (
                    [...appointments]
                      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
                      .map((apt, i) => (
                        <div key={apt.id || i} className="p-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 
                                apt.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' : 
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{apt.doctorName}</h4>
                                <p className="text-xs text-slate-500">{apt.department} · {apt.status}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {new Date(apt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-xs text-slate-400">{apt.time}</div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-between items-end">
                            <div className="text-xs text-slate-500 italic">
                              {apt.reason ? `"${apt.reason}"` : "No reason provided"}
                            </div>
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                              Recorded: {apt.createdAt ? new Date(apt.createdAt).toLocaleString() : "N/A"}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && profile && (
            <motion.div 
              key="profile-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="w-24 h-24 bg-fasil-teal rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{profile.name}</h3>
                        <p className="text-slate-500">Patient ID: {profile.id}</p>
                        <div className="flex space-x-4 mt-2">
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                            DOB: {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                          </span>
                          <span className="text-xs bg-fasil-mint px-2 py-1 rounded text-fasil-teal font-bold">Blood Type: O+</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Mail className="w-4 h-4 mr-3 text-slate-400" />
                          {profile.email}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="w-4 h-4 mr-3 text-slate-400" />
                          {profile.phone}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                          {profile.address}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Stethoscope className="w-4 h-4 mr-3 text-slate-400" />
                          Primary: {profile.primaryPhysician}
                        </div>
                        <div className="bg-fasil-mint/30 p-4 rounded-xl border border-fasil-mint/50">
                          <div className="text-[10px] uppercase font-bold text-fasil-teal mb-2 flex items-center">
                            <UserPlus className="w-3 h-3 mr-1" /> Emergency Contact
                          </div>
                          <div className="text-sm font-bold text-slate-900">{profile.emergencyContact.name}</div>
                          <div className="text-xs text-slate-500">{profile.emergencyContact.relationship} · {profile.emergencyContact.phone}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical History */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center">
                        <History className="w-5 h-5 mr-2 text-fasil-teal" /> Medical History
                      </h4>
                      <button 
                        onClick={() => setShowHistoryLog(true)}
                        className="text-xs font-bold text-fasil-teal hover:underline flex items-center"
                      >
                        <Clock className="w-3 h-3 mr-1" /> View History Log
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Past Illnesses</div>
                        <ul className="space-y-2">
                          {profile.medicalHistory.illnesses.map((entry, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center">
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2" /> {typeof entry === 'string' ? entry : entry.item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Surgeries</div>
                        <ul className="space-y-2">
                          {profile.medicalHistory.surgeries.map((entry, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center">
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2" /> {typeof entry === 'string' ? entry : entry.item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chronic Conditions</div>
                        <ul className="space-y-2">
                          {profile.medicalHistory.chronicConditions.map((entry, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center">
                              <Heart className="w-3.5 h-3.5 text-rose-400 mr-2" /> {typeof entry === 'string' ? entry : entry.item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h5 className="text-xs font-bold text-slate-400 uppercase mb-4">Add New Entry</h5>
                      <form onSubmit={handleAddMedicalEntry} className="flex space-x-3">
                        <select 
                          value={newMedicalItem.type}
                          onChange={(e) => setNewMedicalItem({ ...newMedicalItem, type: e.target.value as any })}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fasil-teal/20"
                        >
                          <option value="illnesses">Illness</option>
                          <option value="surgeries">Surgery</option>
                          <option value="chronicConditions">Condition</option>
                        </select>
                        <input 
                          type="text"
                          value={newMedicalItem.content}
                          onChange={(e) => setNewMedicalItem({ ...newMedicalItem, content: e.target.value })}
                          placeholder="e.g. Seasonal Flu, Appendectomy..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fasil-teal/20"
                        />
                        <button 
                          type="submit"
                          className="bg-fasil-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-fasil-teal-dark transition-colors"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  <div className="bg-fasil-teal text-white rounded-2xl p-6 shadow-lg">
                    <h4 className="font-bold mb-4 flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2" /> Health Summary
                    </h4>
                    <p className="text-sm opacity-80 leading-relaxed">
                      Your health records are encrypted and only accessible by authorized medical staff at SSRN Hospital.
                    </p>
                    <button className="mt-6 w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-bold transition-colors border border-white/20">
                      Download Full Record (PDF)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditProfile && profile && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-6">Edit My Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                      <input name="phone" defaultValue={profile.phone} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date of Birth</label>
                      <input type="date" name="dob" defaultValue={profile.dateOfBirth} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Address</label>
                    <input name="address" defaultValue={profile.address} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Primary Physician</label>
                    <input name="physician" defaultValue={profile.primaryPhysician} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input name="emergencyName" defaultValue={profile.emergencyContact.name} placeholder="Name" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" />
                      <input name="emergencyRelation" defaultValue={profile.emergencyContact.relationship} placeholder="Relationship" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" />
                    </div>
                    <input name="emergencyPhone" defaultValue={profile.emergencyContact.phone} placeholder="Phone" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowEditProfile(false)}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-fasil-teal text-white py-3 rounded-xl font-bold hover:bg-fasil-teal-dark transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Booking Modal */}
        <AnimatePresence>
          {showBooking && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-6">Book an Appointment</h3>
                <form onSubmit={bookAppointment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department</label>
                      <select name="department" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                        <option>General Medicine</option>
                        <option>Cardiology</option>
                        <option>Radiology</option>
                        <option>Pediatrics</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Doctor</label>
                      <select name="doctor" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                        <option>Dr. Navin Ramgoolam</option>
                        <option>Dr. Arvin Boolell</option>
                        <option>Dr. Maya Hanoomanjee</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                      <input type="date" name="date" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Time</label>
                      <input type="time" name="time" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason for visit (Optional)</label>
                    <textarea name="reason" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="Briefly describe your symptoms or reason for visit..."></textarea>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowBooking(false)}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-fasil-teal text-white py-3 rounded-xl font-bold hover:bg-fasil-teal-dark transition-colors"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* History Log Modal */}
        <AnimatePresence>
          {showHistoryLog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-fasil-teal" /> Medical History Log
                  </h3>
                  <button 
                    onClick={() => setShowHistoryLog(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-4">Add New Entry</h5>
                    <form onSubmit={handleAddMedicalEntry} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <select 
                        value={newMedicalItem.type}
                        onChange={(e) => setNewMedicalItem({ ...newMedicalItem, type: e.target.value as any })}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fasil-teal/20"
                      >
                        <option value="illnesses">Illness</option>
                        <option value="surgeries">Surgery</option>
                        <option value="chronicConditions">Condition</option>
                      </select>
                      <input 
                        type="text"
                        value={newMedicalItem.content}
                        onChange={(e) => setNewMedicalItem({ ...newMedicalItem, content: e.target.value })}
                        placeholder="e.g. Seasonal Flu, Appendectomy..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fasil-teal/20"
                      />
                      <button 
                        type="submit"
                        className="bg-fasil-teal text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-fasil-teal-dark transition-colors"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {getChronologicalLog().length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No medical history entries found.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8">
                      {getChronologicalLog().map((entry, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[41px] top-1 w-4 h-4 bg-white border-2 border-fasil-teal rounded-full" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-fasil-teal uppercase tracking-widest mb-1">
                              {new Date(entry.timestamp).toLocaleDateString()} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                entry.type === 'Illness' ? 'bg-amber-100 text-amber-700' : 
                                entry.type === 'Surgery' ? 'bg-blue-100 text-blue-700' : 
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {entry.type}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900">{entry.item}</h5>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setShowHistoryLog(false)}
                    className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Close Log
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Gemini Explanation Modal */}
        <AnimatePresence>
          {explaining && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-fasil-mint p-2 rounded-lg text-fasil-teal">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">{explaining}</h3>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl mb-6 italic text-slate-700 leading-relaxed">
                  {explanation || "Consulting medical database..."}
                </div>
                <button 
                  onClick={() => { setExplaining(null); setExplanation(null); }}
                  className="w-full bg-fasil-teal text-white py-3 rounded-xl font-bold hover:bg-fasil-teal-dark transition-colors"
                >
                  Got it, thanks
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const StaffPortal = ({ user }: { user: AppUser }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffAdvice, setStaffAdvice] = useState<Record<string, string>>({});
  const [smsPreview, setSmsPreview] = useState<Test | null>(null);
  const [showNewTest, setShowNewTest] = useState(false);
  const [updatingTest, setUpdatingTest] = useState<Test | null>(null);
  const [processingReminders, setProcessingReminders] = useState(false);

  useEffect(() => {
    const testsQuery = query(collection(db, 'tests'));
    const unsubscribe = onSnapshot(testsQuery, (snapshot) => {
      setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tests'));

    // Automated reminders check on mount
    processAutomatedReminders();

    return () => unsubscribe();
  }, []);

  const processAutomatedReminders = async () => {
    setProcessingReminders(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('status', '==', 'Upcoming'),
        where('reminderSent', '==', false)
      );
      const snapshot = await getDocs(q);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      let sentCount = 0;
      for (const docSnap of snapshot.docs) {
        const apt = { id: docSnap.id, ...docSnap.data() } as Appointment;
        if (apt.date === tomorrowStr) {
          await updateDoc(doc(db, 'appointments', docSnap.id), {
            reminderSent: true
          });
          sentCount++;
        }
      }

      if (sentCount > 0) {
        toast.success(`Automated Reminders Sent`, {
          description: `Successfully sent ${sentCount} SMS reminders for tomorrow's appointments.`
        });
      }
    } catch (err) {
      console.error("Error processing reminders:", err);
    } finally {
      setProcessingReminders(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTest = {
      patientName: formData.get('patientName'),
      patientId: formData.get('patientId'),
      type: formData.get('type'),
      requestedDate: new Date().toISOString(),
      status: 'Pending',
      waitingDays: 0,
      location: formData.get('location'),
      timeSlot: formData.get('timeSlot'),
      progress: 10,
    };

    try {
      await addDoc(collection(db, 'tests'), newTest);
      toast.success(`Test created for ${newTest.patientName}`);
      setShowNewTest(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tests');
    }
  };

  const handleUpdateStatus = async (testId: string, status: Test['status'], progress: number) => {
    try {
      await updateDoc(doc(db, 'tests', testId), { status, progress });
      setUpdatingTest(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tests/${testId}`);
    }
  };

  const getAdvice = async (test: Test) => {
    if (staffAdvice[test.id]) return;
    
    try {
      // Fetch patient profile
      const profilesQuery = query(collection(db, 'profiles'), where('id', '==', test.patientId));
      const profileSnapshot = await getDocs(profilesQuery);
      const patientProfile = !profileSnapshot.empty ? profileSnapshot.docs[0].data() : null;
      
      // Fetch other tests for this patient
      const otherTestsQuery = query(collection(db, 'tests'), where('patientId', '==', test.patientId));
      const otherTestsSnapshot = await getDocs(otherTestsQuery);
      const otherTests = otherTestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const advice = await suggestStaffAction(test, patientProfile, otherTests);
      setStaffAdvice(prev => ({ ...prev, [test.id]: advice }));
    } catch (err) {
      console.error("Error getting AI advice:", err);
      const advice = await suggestStaffAction(test);
      setStaffAdvice(prev => ({ ...prev, [test.id]: advice }));
    }
  };

  const delayedCount = tests.filter(t => {
    const requestedDate = new Date(t.requestedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - requestedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return t.status === 'Delayed' || diffDays > 14;
  }).length;

  const getWaitingDays = (requestedDateStr: string) => {
    const requestedDate = new Date(requestedDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - requestedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-fasil-teal text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="bg-white text-fasil-teal p-1 rounded font-bold text-sm">FC</div>
            <span className="font-bold">FasilCare — Staff Portal</span>
          </div>
          <div className="h-4 w-px bg-white/20 mx-2" />
          <div className="text-xs opacity-60 flex items-center space-x-4">
            <span>SSRN Hospital</span>
            <span>Dr. Patel</span>
            <span>Diagnostics</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="bg-white/10 border border-white/20 rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:bg-white/20 transition-all w-64"
            />
          </div>
          <button onClick={() => logout()} className="text-sm opacity-60 hover:opacity-100 flex items-center">
            <LogOut className="w-4 h-4 mr-1" /> Exit Portal
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active patients', value: tests.length, color: 'text-slate-900' },
            { label: 'Results ready', value: tests.filter(t => t.status === 'Results ready').length, color: 'text-emerald-600' },
            { label: 'Tests pending', value: tests.filter(t => t.status === 'Pending').length, color: 'text-blue-600' },
            { label: 'Delayed — action!', value: delayedCount, color: 'text-rose-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className={`text-4xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Diagnostic Queue</h2>
          <div className="flex space-x-3">
            <button 
              onClick={processAutomatedReminders}
              disabled={processingReminders}
              className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {processingReminders ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
              Run Reminders
            </button>
            <button 
              onClick={() => setShowNewTest(true)}
              className="bg-fasil-teal text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-sm hover:bg-fasil-teal-dark transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> New Diagnostic Test
            </button>
          </div>
        </div>

        {delayedCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-8 flex items-center space-x-3 text-rose-800"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">
              {delayedCount} patients have tests delayed over 14 days. Please review and update their status to resume SMS notifications.
            </p>
          </motion.div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Test</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Waiting</th>
                <th className="px-6 py-4">AI Insight</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Loading diagnostics...</td></tr>
              ) : (
                tests.map(test => (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{test.patientName}</div>
                      <div className="text-xs text-slate-400">{test.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{test.type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${getWaitingDays(test.requestedDate) > 10 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {getWaitingDays(test.requestedDate)} days
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {staffAdvice[test.id] ? (
                        <div className="text-xs text-fasil-teal bg-fasil-mint/50 p-2 rounded-lg border border-fasil-mint italic">
                          "{staffAdvice[test.id]}"
                        </div>
                      ) : (
                        <button 
                          onClick={() => getAdvice(test)}
                          className="text-xs text-slate-400 hover:text-fasil-teal flex items-center"
                        >
                          <Activity className="w-3 h-3 mr-1" /> Get AI insight
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          if (test.status === 'Results ready') {
                            setSmsPreview(test);
                          } else {
                            setUpdatingTest(test);
                          }
                        }}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        test.status === 'Delayed' 
                          ? 'bg-rose-600 text-white hover:bg-rose-700' 
                          : test.status === 'Results ready'
                          ? 'bg-fasil-teal text-white hover:bg-fasil-teal-dark'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}>
                        {test.status === 'Delayed' ? 'Update' : test.status === 'Results ready' ? 'Send SMS' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SMS Preview Modal */}
        <AnimatePresence>
          {showNewTest && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-6">New Diagnostic Test</h3>
                <form onSubmit={handleCreateTest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Patient Name</label>
                      <input name="patientName" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="e.g. Aisha Mohamad" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Patient ID / UID</label>
                      <input name="patientId" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="e.g. VH-2024-0312" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Test Type</label>
                    <input name="type" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="e.g. Blood test — full panel" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location</label>
                      <input name="location" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="e.g. SSRN Hospital, Room 4" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Time Slot / Schedule</label>
                      <input name="timeSlot" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="e.g. 8am–12pm" />
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowNewTest(false)}
                      className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-fasil-teal text-white py-3 rounded-xl font-bold hover:bg-fasil-teal-dark transition-colors"
                    >
                      Create Test
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Update Status Modal */}
        <AnimatePresence>
          {updatingTest && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <h3 className="text-xl font-bold mb-2">Update Test Status</h3>
                <p className="text-sm text-slate-500 mb-6">{updatingTest.patientName} · {updatingTest.type}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select 
                      defaultValue={updatingTest.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as Test['status'];
                        let progress = updatingTest.progress;
                        if (newStatus === 'Results ready') progress = 100;
                        if (newStatus === 'In progress') progress = 50;
                        if (newStatus === 'Pending') progress = 10;
                        handleUpdateStatus(updatingTest.id, newStatus, progress);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In progress">In progress</option>
                      <option value="Results ready">Results ready</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => setUpdatingTest(null)}
                      className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SMS Preview Modal */}
        <AnimatePresence>
          {smsPreview && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-fasil-mint p-2 rounded-lg text-fasil-teal">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Bilingual SMS Preview</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">English</div>
                    <p className="text-sm text-slate-700">
                      Your {smsPreview.type} results are ready. Return to {smsPreview.location}, {smsPreview.timeSlot}. Ref: {smsPreview.id}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-2">Mauritian Creole</div>
                    <p className="text-sm text-emerald-900 italic">
                      Ou bann rezilta {smsPreview.type.split(' ')[0]} pare. Al {smsPreview.location.split(',')[0]}, {smsPreview.location.split(',')[1] || 'Lasal 4'}. Ref: {smsPreview.id}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button 
                    onClick={() => setSmsPreview(null)}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      toast.success(`SMS sent to ${smsPreview.patientName}`, {
                        description: `Bilingual notification sent for ${smsPreview.type}`
                      });
                      setSmsPreview(null);
                    }}
                    className="flex-1 bg-fasil-teal text-white py-3 rounded-xl font-bold hover:bg-fasil-teal-dark transition-colors"
                  >
                    Send Now
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as AppUser);
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleSelect = async (role: UserRole) => {
    if (!user) return;
    
    const newProfile: AppUser = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || 'User',
      role: role,
    };

    if (role === 'patient') {
      newProfile.patientId = `VH-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile(newProfile);
      
      if (role === 'patient') {
        // Create initial patient profile
        const patientProfile: PatientProfile = {
          id: newProfile.patientId!,
          name: newProfile.name,
          dateOfBirth: '',
          email: newProfile.email,
          phone: '',
          address: '',
          primaryPhysician: 'Dr. Patel',
          emergencyContact: { name: '', relationship: '', phone: '' },
          medicalHistory: { illnesses: [], surgeries: [], chronicConditions: [] }
        };
        await setDoc(doc(db, 'profiles', user.uid), {
          ...patientProfile,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fasil-teal flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-50" />
        <p className="text-lg font-medium opacity-80">Initializing FasilCare...</p>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased">
      <Toaster position="top-right" richColors />
      <AnimatePresence mode="wait">
        {!user && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage onLogin={loginWithGoogle} />
          </motion.div>
        )}
        
        {user && !userProfile && (
          <motion.div 
            key="role-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RoleSelection onSelect={handleRoleSelect} />
          </motion.div>
        )}

        {user && userProfile?.role === 'patient' && (
          <motion.div 
            key="patient"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="w-full"
          >
            <PatientPortal user={userProfile} />
          </motion.div>
        )}

        {user && userProfile?.role === 'staff' && (
          <motion.div 
            key="staff"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="w-full"
          >
            <StaffPortal user={userProfile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
