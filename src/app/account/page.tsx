'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Trash2, User, Loader2, Plus, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';

// Define available units
const UNIT_SYSTEMS = {
  metric: {
    label: 'Metric',
    weight: ['kg', 'g'],
    volume: ['L', 'ml'],
    length: ['m', 'cm'],
    temperature: '°C'
  },
  imperial: {
    label: 'Imperial',
    weight: ['lb', 'oz'],
    volume: ['gal', 'fl oz', 'cup'],
    length: ['ft', 'in'],
    temperature: '°F'
  }
}

const COMMON_UNITS = ['pcs', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle']

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  // Form states
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Profile data
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // Preferences
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [preferredUnits, setPreferredUnits] = useState<string[]>([])
  const [defaultServings, setDefaultServings] = useState('4')
  const [newUnit, setNewUnit] = useState('')
  const [showAddUnit, setShowAddUnit] = useState(false)
  
  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  
  // Drag state for preferred units
  const [draggedUnit, setDraggedUnit] = useState<string | null>(null)
  const [dragOverUnit, setDragOverUnit] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      // Get user profile from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      if (profile) {
        setEmail(profile.email || '')
        setUsername(profile.username || '')
        setBio(profile.bio || '')
        setAvatarUrl(profile.avatar_url || '')
        setUnitSystem(profile.unit_system || 'metric')
        setPreferredUnits(profile.preferred_units || [])
        setDefaultServings(profile.default_servings || '4')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          unit_system: unitSystem,
          preferred_units: preferredUnits,
          default_servings: defaultServings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      showMessage('success', 'Profile updated successfully!')
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      showMessage('success', 'Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      showMessage('error', 'Please type DELETE to confirm')
      return
    }
    
    setLoading(true)
    try {
      // Delete all user data first
      const { error: pantryError } = await supabase
        .from('pantry_items')
        .delete()
        .eq('user_id', user!.id);
      
      const { error: recipesError } = await supabase
        .from('recipes')
        .delete()
        .eq('user_id', user!.id);
      
      const { error: priceError } = await supabase
        .from('price_tracker_items')
        .delete()
        .eq('user_id', user!.id);
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Call API endpoint to delete account
        const response = await fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Sign out and redirect
          await signOut();
          router.push('/');
        } else {
          throw new Error(result.error || 'Failed to delete account');
        }
      } else {
        throw new Error('No active session');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    setLoading(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = fileName // Remove 'avatars/' prefix since we're already uploading to 'avatars' bucket
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      setAvatarUrl(data.publicUrl)
      showMessage('success', 'Avatar uploaded successfully!')
    } catch (error: any) {
      if (error.message && error.message.includes('row-level security') || error.message.includes('violates row-level security policy')) {
        showMessage('error', 'Avatar upload requires storage permissions. Please contact support or check Supabase Storage policies for the avatars bucket.')
      } else {
        showMessage('error', error.message || 'Failed to upload avatar')
      }
    } finally {
      setLoading(false)
    }
  }

  const togglePreferredUnit = (unit: string) => {
    setPreferredUnits(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit)
        : [...prev, unit]
    )
  }

  const addCustomUnit = () => {
    if (newUnit.trim() && !preferredUnits.includes(newUnit.trim())) {
      setPreferredUnits(prev => [...prev, newUnit.trim()])
      setNewUnit('')
      setShowAddUnit(false)
    }
  }

  const removeUnit = (unit: string) => {
    setPreferredUnits(prev => prev.filter(u => u !== unit))
  }
  
  // Drag and drop handlers for preferred units
  const handleDragStart = (e: React.DragEvent, unit: string) => {
    setDraggedUnit(unit)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent, unit: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverUnit(unit)
  }
  
  const handleDrop = (e: React.DragEvent, dropUnit: string) => {
    e.preventDefault()
    if (!draggedUnit || draggedUnit === dropUnit) return
    
    const newUnits = [...preferredUnits]
    const draggedIndex = newUnits.indexOf(draggedUnit)
    const dropIndex = newUnits.indexOf(dropUnit)
    
    // Remove dragged unit from its position
    newUnits.splice(draggedIndex, 1)
    // Insert at new position
    newUnits.splice(dropIndex, 0, draggedUnit)
    
    setPreferredUnits(newUnits)
    setDraggedUnit(null)
    setDragOverUnit(null)
  }
  
  const handleDragEnd = () => {
    setDraggedUnit(null)
    setDragOverUnit(null)
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold">{username || user.email}</h3>
                    <p className="text-sm text-gray-600">Upload a new avatar</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your measurement units and default settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit-system">Unit System</Label>
                    <Select value={unitSystem} onValueChange={(value: 'metric' | 'imperial') => setUnitSystem(value)}>
                      <SelectTrigger id="unit-system">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (kg, L, °C)</SelectItem>
                        <SelectItem value="imperial">Imperial (lb, oz, °F)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label>Preferred Units</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddUnit(!showAddUnit)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Custom Unit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Select your commonly used units. These will appear first in all unit selections.
                    </p>
                    
                    {/* Custom unit input */}
                    {showAddUnit && (
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Enter custom unit (e.g., 'pinch')"
                          value={newUnit}
                          onChange={(e) => setNewUnit(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomUnit()}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCustomUnit}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddUnit(false)
                            setNewUnit('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    
                    {/* Selected/preferred units */}
                    {preferredUnits.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Your Preferred Units (drag to reorder):</h4>
                        <div className="flex flex-wrap gap-2">
                          {preferredUnits.map(unit => (
                            <div
                              key={unit}
                              className={`flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full cursor-move transition-all ${
                                dragOverUnit === unit ? 'ring-2 ring-blue-400' : ''
                              }`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, unit)}
                              onDragOver={(e) => handleDragOver(e, unit)}
                              onDrop={(e) => handleDrop(e, unit)}
                              onDragEnd={handleDragEnd}
                            >
                              <span className="text-sm select-none">{unit}</span>
                              <button
                                type="button"
                                onClick={() => removeUnit(unit)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Available units to add */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {/* System units */}
                      {UNIT_SYSTEMS[unitSystem].weight.map(unit => (
                        <Button
                          key={unit}
                          type="button"
                          variant={preferredUnits.includes(unit) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePreferredUnit(unit)}
                          disabled={preferredUnits.includes(unit)}
                        >
                          {unit}
                        </Button>
                      ))}
                      {UNIT_SYSTEMS[unitSystem].volume.map(unit => (
                        <Button
                          key={unit}
                          type="button"
                          variant={preferredUnits.includes(unit) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePreferredUnit(unit)}
                          disabled={preferredUnits.includes(unit)}
                        >
                          {unit}
                        </Button>
                      ))}
                      {/* Common units */}
                      {COMMON_UNITS.filter(unit => !preferredUnits.includes(unit)).map(unit => (
                        <Button
                          key={unit}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => togglePreferredUnit(unit)}
                        >
                          {unit}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="default-servings">Default Recipe Servings</Label>
                    <Select value={defaultServings} onValueChange={setDefaultServings}>
                      <SelectTrigger id="default-servings">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'serving' : 'servings'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 mb-4">
                    <li>Your profile and all personal information</li>
                    <li>All your pantry items</li>
                    <li>All your saved recipes</li>
                    <li>All your price tracking data</li>
                  </ul>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Label htmlFor="delete-confirm">
                          Type <span className="font-bold">DELETE</span> to confirm
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="Type DELETE"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={loading || deleteConfirm !== 'DELETE'}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Account'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 