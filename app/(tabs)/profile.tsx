import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { userApi } from '../../src/api';
import { getImageUrl } from '../../src/api/client';
import type { User } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const res = await userApi.getProfile();
      setProfile(res.data.data ?? null);
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const MenuItem = ({ label, icon, onPress, danger }: { label: string; icon: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: colors.error }]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  const p = profile || user;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {p?.avatarUrl ? (
            <Image source={{ uri: p.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{p?.firstName?.[0]}{p?.lastName?.[0]}</Text>
          )}
        </View>
        <Text style={styles.profileName}>{p?.firstName} {p?.lastName}</Text>
        <Text style={styles.profileEmail}>{p?.email}</Text>
        <Text style={styles.profilePhone}>{p?.phone || 'No phone added'}</Text>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Account</Text>
        <MenuItem label="My Addresses" icon="📍" onPress={() => router.push('/address')} />
        <MenuItem label="Order History" icon="📋" onPress={() => router.push('/(tabs)/orders')} />
        <MenuItem label="Wishlist" icon="❤️" onPress={() => router.push('/wishlist')} />
        <MenuItem label="Change Password" icon="🔑" onPress={() => router.push('/change-password')} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Support</Text>
        <MenuItem label="Help & FAQ" icon="❓" onPress={() => {}} />
        <MenuItem label="Contact Us" icon="📧" onPress={() => {}} />
        <MenuItem label="Privacy Policy" icon="🔒" onPress={() => {}} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  profileCard: { alignItems: 'center', padding: spacing.xxl, marginHorizontal: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.white },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.text },
  profileEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  profilePhone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  menuSection: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  menuSectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  menuIcon: { fontSize: 18, marginRight: spacing.md },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  menuArrow: { fontSize: 20, color: colors.textLight, fontWeight: '300' },
  logoutBtn: { marginHorizontal: spacing.xl, marginTop: spacing.xxl, paddingVertical: 16, alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});
