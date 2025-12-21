
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppSection, ActivityItem, Address } from '../types';
import { api, FIXIT_SERVICES, KUBWA_AREAS } from '../services/data';
import { Button, Input, Card, Badge, Select } from '../components/ui';
import { Mail, Lock, LogOut, CheckCircle, AlertCircle, Loader2, X, Shield, CreditCard, Crown, Star, ShoppingBag, Truck, Wrench, MapPin, Edit2, Check, User as UserIcon, Phone, FileText, LayoutDashboard, ArrowLeft, Bike, Store, Briefcase } from 'lucide-react';

interface AccountProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setSection?: (section: AppSection) => void;
  triggerNotification?: () => void;
  authIntent?: { section: AppSection; role: UserRole } | null;
  refreshUser: () => void;
}

const Account: React.FC<AccountProps> = ({ user, setUser, setSection, authIntent, refreshUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'address'>('profile');
  
  // Auth Form State
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    phoneNumber: '',
    storeName: '',
    address: ''
  });

  // Vendor Form State for Upgrade/Signup Completion
  const [vendorForm, setVendorForm] = useState({
    storeName: '',
    description: '',
    businessAddress: ''
  });

  // Data State
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState({ title: '', details: '' });
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFixitModal, setShowFixitModal] = useState(false);

  // Fixit Application State
  const [fixitForm, setFixitForm] = useState({
      businessName: '',
      phoneNumber: '',
      location: KUBWA_AREAS[0],
      bio: '',
      services: [] as string[]
  });

  // Determine signup role from intent or default to USER
  const signupRole: UserRole = authIntent?.role || 'USER';

  // Initial Load & Form Sync
  useEffect(() => {
    if (user) {
      if (activeTab === 'activity') loadActivity();
      if (activeTab === 'address') loadAddresses();
      
      // Sync edit form with user data
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        phoneNumber: user.phoneNumber || '',
        storeName: user.storeName || '',
        address: user.address || ''
      });

      // Pre-fill fixit form
      setFixitForm(prev => ({
          ...prev,
          businessName: user.name,
          phoneNumber: user.phoneNumber || ''
      }));

      // CHECK FOR UPGRADE INTENT OR INCOMPLETE VENDOR SIGNUP
      const isVendorUpgradeNeeded = authIntent?.role === 'VENDOR' && user.role !== 'VENDOR';
      const isVendorSignupIncomplete = user.role === 'VENDOR' && !user.storeName;
      
      if (isVendorUpgradeNeeded || isVendorSignupIncomplete) {
          setShowUpgradeModal(true);
          // Pre-fill vendor form if possible
          setVendorForm(prev => ({
            ...prev,
            storeName: user.storeName || '',
            description: user.bio || '',
            businessAddress: user.address || ''
          }));
      }
    }
  }, [user, activeTab, authIntent]);

  const loadActivity = async () => {
    if (!user) return;
    const data = await api.users.getActivity(user.id);
    setActivity(data);
  };

  const loadAddresses = async () => {
    if (!user) return;
    const data = await api.users.getAddresses(user.id);
    setAddresses(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authView === 'FORGOT') {
        const { error } = await api.auth.resetPassword(email);
        if (error) {
          setError(error);
        } else {
          setSuccessMsg('Password reset link sent to your email.');
        }
      } else if (authView === 'LOGIN') {
        const { user: loggedInUser, error } = await api.auth.signIn(email, password);
        if (error) {
          setError(error);
        } else if (loggedInUser) {
          setUser(loggedInUser);
          if (authIntent && setSection) {
            setSection(authIntent.section);
          }
        }
      } else {
        // SIGNUP - Uses the detected role (User or Rider)
        const { user: newUser, error } = await api.auth.signUp(email, password, name, signupRole);
        if (error) {
          setError(error);
        } else if (newUser) {
          setUser(newUser);
          if (authIntent && setSection) {
            setSection(authIntent.section);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setUser(null);
    if (setSection) setSection(AppSection.HOME);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    
    const updatedUser = await api.users.updateProfile(user.id, {
      name: editForm.name,
      bio: editForm.bio,
      phoneNumber: editForm.phoneNumber,
      storeName: editForm.storeName,
      address: editForm.address
    });

    if (updatedUser) {
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      refreshUser(); 
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setError('Failed to update profile. Please try again.');
    }
    setLoading(false);
  };

  const handleUpgradeToVendor = async () => {
      if (!user) return;
      if (!vendorForm.storeName || !vendorForm.businessAddress) {
          setError("Store Name and Business Address are required.");
          return;
      }
      
      setLoading(true);
      setError('');
      
      const roleSuccess = await api.users.updateRole(user.id, 'VENDOR');
      const profileSuccess = await api.users.updateProfile(user.id, {
          storeName: vendorForm.storeName,
          bio: vendorForm.description,
          address: vendorForm.businessAddress
      });

      if (roleSuccess && profileSuccess) {
          await refreshUser(); // Fetch new role and profile data
          setShowUpgradeModal(false);
          setSuccessMsg("Congratulations! Your vendor profile is set up.");
          // Redirect to Mart after short delay
          setTimeout(() => {
              if (setSection) setSection(AppSection.MART);
          }, 1500);
      } else {
          setError("Action failed. Please contact support.");
      }
      setLoading(false);
  };

  const handleBecomeFixit = async () => {
      if (!user) return;
      if (!fixitForm.phoneNumber || fixitForm.services.length === 0) {
          alert("Please provide a phone number and select at least one service.");
          return;
      }
      
      setLoading(true);
      
      // 1. Update Profile info first if needed
      if (!user.phoneNumber) {
          await api.users.updateProfile(user.id, { phoneNumber: fixitForm.phoneNumber });
      }

      // 2. Call specialized API to create Provider record
      const success = await api.users.becomeProvider(user.id, fixitForm);
      
      if (success) {
          // 3. Update User Role to PROVIDER & Status to PENDING locally/remotely
          await api.users.updateStatus(user.id, 'PENDING'); // Mark user as pending approval
          await refreshUser();
          setShowFixitModal(false);
          setSuccessMsg("Application Sent! An admin will review your profile shortly.");
          setTimeout(() => {
              if (setSection) setSection(AppSection.FIXIT);
          }, 1500);
      } else {
          setError("Application failed. Please try again.");
      }
      setLoading(false);
  };

  const toggleFixitService = (service: string) => {
      setFixitForm(prev => {
          const exists = prev.services.includes(service);
          return {
              ...prev,
              services: exists ? prev.services.filter(s => s !== service) : [...prev.services, service]
          };
      });
  };

  const handleAddAddress = async () => {
    if (!user || !newAddress.title || !newAddress.details) return;
    setLoading(true);
    const addr = await api.users.saveAddress(user.id, newAddress.title, newAddress.details);
    if (addr) {
      setAddresses([...addresses, addr]);
      setNewAddress({ title: '', details: '' });
      setShowAddAddress(false);
    }
    setLoading(false);
  };

  const handleDeleteAddress = async (id: string) => {
    const success = await api.users.deleteAddress(id);
    if (success) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- GUEST VIEW ---
  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            {signupRole === 'RIDER' && authView === 'SIGNUP' && (
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bike size={24} />
               </div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
                {authView === 'LOGIN' ? 'Welcome Back' : authView === 'SIGNUP' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {authView === 'LOGIN' ? 'Sign in to access your orders and profile.' : 
               authView === 'SIGNUP' && signupRole === 'RIDER' ? 'Join as a Rider and start earning.' :
               authView === 'SIGNUP' ? 'Join the Kubwa Connect community today.' :
               'Enter your email to receive a reset link.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authView === 'SIGNUP' && (
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="e.g. Musa Ibrahim" 
                    className="pl-10" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-10" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            {authView !== 'FORGOT' && (
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    required 
                  />
                </div>
                {authView === 'LOGIN' && (
                    <div className="flex justify-end mt-1">
                        <button type="button" onClick={() => { setAuthView('FORGOT'); setError(''); setSuccessMsg(''); }} className="text-xs text-kubwa-green hover:underline">
                            Forgot Password?
                        </button>
                    </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            <Button className="w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 className="animate-spin" size={18} />}
              {authView === 'LOGIN' ? 'Sign In' : authView === 'SIGNUP' ? (signupRole === 'RIDER' ? 'Register Rider' : 'Sign Up') : 'Send Link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {authView === 'LOGIN' ? (
                <>
                    Don't have an account? {' '}
                    <button onClick={() => { setAuthView('SIGNUP'); setError(''); }} className="text-kubwa-green font-bold hover:underline">
                        Sign Up
                    </button>
                </>
            ) : authView === 'SIGNUP' ? (
                <>
                    Already have an account? {' '}
                    <button onClick={() => { setAuthView('LOGIN'); setError(''); }} className="text-kubwa-green font-bold hover:underline">
                        Log In
                    </button>
                </>
            ) : (
                <button onClick={() => { setAuthView('LOGIN'); setError(''); setSuccessMsg(''); }} className="flex items-center justify-center gap-1 mx-auto text-gray-600 hover:text-kubwa-green">
                    <ArrowLeft size={14} /> Back to Sign In
                </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // --- WAITING FOR APPROVAL VIEW (FOR RIDERS) ---
  if (user.role === 'RIDER' && user.status === 'PENDING') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 animate-fade-in text-center">
           <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <Shield size={48} className="text-yellow-600" />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
           <p className="text-gray-600 max-w-xs mx-auto mb-8 leading-relaxed">
              Thanks for registering as a rider! Our team is reviewing your application. 
              You will be notified once your account is active.
           </p>
           <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut size={18} /> Sign Out
           </Button>
        </div>
      );
  }

  // --- LOGGED IN VIEW ---
  return (
    <div className="pb-24 pt-4 px-4 max-w-2xl mx-auto relative">
      
      {/* VENDOR UPGRADE / SETUP MODAL */}
      {showUpgradeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <Card className="w-full max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                  <div className="bg-kubwa-green text-white p-4 text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Store size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Vendor Onboarding</h3>
                      <p className="text-white/80 text-xs">Set up your store to start selling in Kubwa.</p>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                          <AlertCircle size={16} /> {error}
                        </div>
                      )}

                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Store Name</label>
                          <Input 
                            value={vendorForm.storeName} 
                            onChange={e => setVendorForm({...vendorForm, storeName: e.target.value})}
                            placeholder="e.g. Mama Nkechi Groceries" 
                            required
                          />
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Business Address</label>
                          <Input 
                            value={vendorForm.businessAddress} 
                            onChange={e => setVendorForm({...vendorForm, businessAddress: e.target.value})}
                            placeholder="e.g. Shop 12, Phase 4 Market, Kubwa" 
                            required
                          />
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Store Description</label>
                          <textarea 
                            className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-kubwa-green outline-none"
                            rows={4}
                            placeholder="Tell customers what you sell and why they should buy from you..."
                            value={vendorForm.description}
                            onChange={e => setVendorForm({...vendorForm, description: e.target.value})}
                          />
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                         <Shield size={20} className="text-blue-500 shrink-0" />
                         <p className="text-[10px] text-blue-700">
                           As a vendor, your store details will be visible to all Kubwa Connect users. 
                           Ensure your information is accurate for better trust and sales.
                         </p>
                      </div>
                  </div>

                  <div className="p-4 border-t bg-gray-50 flex gap-3">
                      {user.role !== 'VENDOR' && (
                        <Button variant="outline" className="flex-1" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
                      )}
                      <Button onClick={handleUpgradeToVendor} disabled={loading} className="flex-[2] bg-kubwa-green hover:opacity-90">
                          {loading ? <Loader2 className="animate-spin" /> : 'Complete Setup'}
                      </Button>
                  </div>
              </Card>
          </div>
      )}

      {/* FIXIT ONBOARDING MODAL */}
      {showFixitModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <Card className="w-full max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                  <div className="bg-kubwa-orange text-white p-4">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Wrench size={20}/> Become a Fixit Pro</h3>
                      <p className="text-xs text-white/80">Fill in your details to start earning.</p>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Business/Display Name</label>
                          <Input 
                            value={fixitForm.businessName} 
                            onChange={e => setFixitForm({...fixitForm, businessName: e.target.value})}
                            placeholder="e.g. Musa Electric" 
                          />
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Phone Number (Required)</label>
                          <Input 
                            type="tel"
                            value={fixitForm.phoneNumber} 
                            onChange={e => setFixitForm({...fixitForm, phoneNumber: e.target.value})}
                            placeholder="080..." 
                          />
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Location</label>
                          <Select 
                            value={fixitForm.location}
                            onChange={e => setFixitForm({...fixitForm, location: e.target.value})}
                          >
                              {KUBWA_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                          </Select>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Services Offered (Select all that apply)</label>
                          <div className="grid grid-cols-2 gap-2">
                              {FIXIT_SERVICES.map(service => (
                                  <button
                                    key={service}
                                    onClick={() => toggleFixitService(service)}
                                    className={`text-[10px] py-2 px-1 rounded border transition-all ${fixitForm.services.includes(service) ? 'bg-orange-100 border-orange-500 text-orange-800 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}
                                  >
                                      {service}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Short Bio / Experience</label>
                          <textarea 
                            className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none"
                            rows={3}
                            placeholder="I have 5 years experience repairing ACs..."
                            value={fixitForm.bio}
                            onChange={e => setFixitForm({...fixitForm, bio: e.target.value})}
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t bg-gray-50 flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowFixitModal(false)}>Cancel</Button>
                      <Button onClick={handleBecomeFixit} disabled={loading} className="flex-[2] bg-kubwa-orange hover:bg-orange-600">
                          {loading ? <Loader2 className="animate-spin" /> : 'Submit Application'}
                      </Button>
                  </div>
              </Card>
          </div>
      )}

      {/* Header Profile Card */}
      <Card className="mb-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border-2 border-white/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-white/70 text-sm">{user.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge color="bg-white/20 text-white border-none">{user.role}</Badge>
                {user.subscription?.tier !== 'STARTER' && (
                  <Badge color="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 flex items-center gap-1">
                    <Crown size={10} /> {user.subscription?.tier}
                  </Badge>
                )}
                {user.isFeatured && (
                  <Badge color="bg-yellow-400 text-black border-none flex items-center gap-1 font-bold">
                    <Star size={10} fill="currentColor" /> Featured Vendor
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
          <div className="text-center">
             <p className="text-xs text-white/50 uppercase font-bold">Joined</p>
             <p className="font-bold">{new Date(user.joinedAt || Date.now()).toLocaleDateString()}</p>
          </div>
          <div className="text-center border-l border-white/10">
             <p className="text-xs text-white/50 uppercase font-bold">Orders</p>
             <p className="font-bold">{activity.length}</p>
          </div>
          <div className="text-center border-l border-white/10">
             <p className="text-xs text-white/50 uppercase font-bold">Status</p>
             <p className="font-bold text-green-400">{user.status}</p>
          </div>
        </div>
      </Card>

      {/* Admin Access Button (Only for Admins) */}
      {user.role === 'ADMIN' && (
        <Button 
          className="w-full mb-6 bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center gap-2 py-3 shadow-lg"
          onClick={() => setSection && setSection(AppSection.ADMIN)}
        >
          <LayoutDashboard size={20} /> Access Admin Dashboard
        </Button>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6">
        {[
          { id: 'profile', label: 'Profile', icon: UserIcon },
          { id: 'activity', label: 'Activity', icon: ShoppingBag },
          { id: 'address', label: 'Address', icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- PROFILE TAB --- */}
      {activeTab === 'profile' && (
        <div className="space-y-4 animate-fade-in">
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Become Vendor/Fixit Cards (Manual Trigger) */}
          {user.role === 'USER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div onClick={() => setShowUpgradeModal(true)} className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-green-100 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="bg-green-200 p-2 rounded-full text-green-800">
                              <Store size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-green-900">Start Selling</h4>
                              <p className="text-xs text-green-700">Join as Vendor</p>
                          </div>
                      </div>
                  </div>
                  
                  <div onClick={() => setShowFixitModal(true)} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="bg-orange-200 p-2 rounded-full text-orange-800">
                              <Wrench size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-orange-900">Earn as a Pro</h4>
                              <p className="text-xs text-orange-700">Join as Fixit Provider</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <Card className="relative">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-800">Personal Information</h3>
               {!isEditing && (
                 <Button variant="outline" onClick={() => setIsEditing(true)} className="py-1.5 px-3 text-xs flex items-center gap-2">
                   <Edit2 size={14} /> Edit Profile
                 </Button>
               )}
            </div>

            <div className="space-y-4">
              {/* Name Field */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                 {isEditing ? (
                   <Input 
                     value={editForm.name} 
                     onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                     className="bg-gray-50"
                   />
                 ) : (
                   <p className="font-medium text-gray-900">{user.name}</p>
                 )}
              </div>

              {/* Email Field (Read Only) */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email Address</label>
                 <div className="flex items-center justify-between">
                   <p className="font-medium text-gray-900">{user.email}</p>
                   {isEditing && <Lock size={14} className="text-gray-400" />}
                 </div>
              </div>

              {/* Phone Field */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone Number</label>
                 {isEditing ? (
                   <Input 
                     value={editForm.phoneNumber} 
                     onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                     placeholder="+234..."
                     type="tel"
                     className="bg-gray-50"
                   />
                 ) : (
                   <p className="font-medium text-gray-900">{user.phoneNumber || 'Not set'}</p>
                 )}
              </div>

              {/* Vendor Specific Fields */}
              {user.role === 'VENDOR' && (
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-xs font-bold text-kubwa-green uppercase">Store Details</h4>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Store Name</label>
                    {isEditing ? (
                      <Input 
                        value={editForm.storeName} 
                        onChange={(e) => setEditForm({...editForm, storeName: e.target.value})}
                        className="bg-gray-50"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{user.storeName || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Business Address</label>
                    {isEditing ? (
                      <Input 
                        value={editForm.address} 
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        className="bg-gray-50"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{user.address || 'Not set'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Bio / Description Field */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{user.role === 'VENDOR' ? 'Store Description' : 'Bio'}</label>
                 {isEditing ? (
                   <textarea
                     value={editForm.bio}
                     onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                     className="w-full p-3 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kubwa-green"
                     rows={3}
                     placeholder={user.role === 'VENDOR' ? "Describe your store..." : "Tell us about yourself..."}
                   />
                 ) : (
                   <p className="text-sm text-gray-600 leading-relaxed italic">
                     {user.bio || "No description provided yet."}
                   </p>
                 )}
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
               <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1" disabled={loading}>
                     Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} className="flex-1" disabled={loading}>
                     {loading ? <Loader2 className="animate-spin" size={16} /> : <span className="flex items-center gap-2"><Check size={16}/> Save Changes</span>}
                  </Button>
               </div>
            )}
          </Card>
          
          <Card>
            <h3 className="font-bold text-gray-800 mb-4">Verification Status</h3>
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
               <Shield size={24} className="text-blue-600" />
               <div>
                  <p className="font-bold text-blue-900 text-sm">Level 1 Verified</p>
                  <p className="text-xs text-blue-700">Email verified. Add NIN for full verification.</p>
               </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- ACTIVITY TAB --- */}
      {activeTab === 'activity' && (
        <div className="space-y-4 animate-fade-in">
           <h3 className="font-bold text-gray-800 mb-2">Recent Activity</h3>
           {activity.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <ShoppingBag className="mx-auto text-gray-300 mb-3" size={32} />
                <p className="text-gray-500 text-sm">No recent activity found.</p>
                <Button variant="outline" className="mt-4 text-xs" onClick={() => setSection && setSection(AppSection.MART)}>Start Shopping</Button>
             </div>
           ) : (
             activity.map((item, idx) => (
               <Card key={idx} className="flex gap-4 items-center">
                  <div className={`p-3 rounded-full ${item.type === 'MART' ? 'bg-orange-100 text-orange-600' : item.type === 'DELIVERY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                     {item.type === 'MART' && <ShoppingBag size={20} />}
                     {item.type === 'DELIVERY' && <Truck size={20} />}
                     {item.type === 'SERVICE' && <Wrench size={20} />}
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between mb-1">
                        <h4 className="font-bold text-sm text-gray-800">
                          {item.type === 'MART' ? `Order #${item.id.slice(-4)}` : item.type === 'DELIVERY' ? 'Delivery Request' : 'Service Booking'}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.status === 'COMPLETED' || item.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {item.status}
                        </span>
                     </div>
                     <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                     {item.type === 'MART' && 'total' in item && (
                        <p className="text-xs font-bold text-gray-900 mt-1">₦{item.total.toLocaleString()}</p>
                     )}
                     {item.type === 'SERVICE' && 'amount' in item && (
                        <p className="text-xs font-bold text-gray-900 mt-1">₦{item.amount.toLocaleString()}</p>
                     )}
                  </div>
               </Card>
             ))
           )}
        </div>
      )}

      {/* --- ADDRESS TAB --- */}
      {activeTab === 'address' && (
        <div className="space-y-4 animate-fade-in">
           <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800">Saved Locations</h3>
              <Button onClick={() => setShowAddAddress(!showAddAddress)} className="py-1.5 px-3 text-xs">
                 {showAddAddress ? 'Cancel' : 'Add New'}
              </Button>
           </div>
           
           {showAddAddress && (
             <Card className="mb-4 bg-gray-50 border-gray-200">
                <h4 className="font-bold text-sm mb-3">Add New Address</h4>
                <div className="space-y-3">
                   <Input 
                     placeholder="Label (e.g. Home, Office)" 
                     value={newAddress.title}
                     onChange={e => setNewAddress({...newAddress, title: e.target.value})}
                   />
                   <Input 
                     placeholder="Full Address (e.g. Phase 4, Kubwa)" 
                     value={newAddress.details}
                     onChange={e => setNewAddress({...newAddress, details: e.target.value})}
                   />
                   <Button className="w-full" onClick={handleAddAddress} disabled={loading || !newAddress.title || !newAddress.details}>
                      {loading ? <Loader2 className="animate-spin" /> : 'Save Address'}
                   </Button>
                </div>
             </Card>
           )}

           {addresses.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm italic">
                No addresses saved yet.
             </div>
           ) : (
             addresses.map(addr => (
               <Card key={addr.id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                     <MapPin className="text-gray-400" size={20} />
                     <div>
                        <p className="font-bold text-gray-800 text-sm">{addr.title}</p>
                        <p className="text-xs text-gray-500">{addr.details}</p>
                     </div>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="text-gray-300 hover:text-red-500">
                     <X size={16} />
                  </button>
               </Card>
             ))
           )}
        </div>
      )}
    </div>
  );
};

export default Account;
