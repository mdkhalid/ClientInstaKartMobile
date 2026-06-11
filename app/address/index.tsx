import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { userApi, orderApi } from '../../src/api';
import type { Address } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function AddressListScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: 'Home', street: '', city: '', state: '', pincode: '', landmark: '',
  });

  useFocusEffect(
    useCallback(() => { loadAddresses(); }, [])
  );

  const loadAddresses = async () => {
    try {
      const res = await userApi.getAddresses();
      setAddresses(res.data.data ?? []);
    } catch {}
    setLoading(false);
  };

  const handleAddAddress = async () => {
    if (!form.street || !form.city || !form.state || !form.pincode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await userApi.addAddress({ ...form, isDefault: addresses.length === 0 });
      setShowForm(false);
      setForm({ label: 'Home', street: '', city: '', state: '', pincode: '', landmark: '' });
      loadAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await userApi.deleteAddress(id); loadAddresses(); } },
    ]);
  };

  const renderItem = ({ item }: { item: Address }) => (
    <TouchableOpacity style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressLabelRow}>
          <Text style={styles.labelIcon}>📍</Text>
          <Text style={styles.addressLabel}>{item.label}</Text>
          {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
        </View>
      </View>
      <Text style={styles.addressText}>{item.street}</Text>
      <Text style={styles.addressText}>{item.city}, {item.state} - {item.pincode}</Text>
      {item.landmark && <Text style={styles.landmark}>Near: {item.landmark}</Text>}
      <View style={styles.addressActions}>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {showForm ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add New Address</Text>
          <View style={styles.labelRow}>
            {['Home', 'Work', 'Other'].map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.labelOption, form.label === l && styles.labelOptionActive]}
                onPress={() => setForm({ ...form, label: l })}
              >
                <Text style={[styles.labelOptionText, form.label === l && styles.labelOptionTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Street / Area" placeholderTextColor={colors.textLight} value={form.street} onChangeText={(v) => setForm({ ...form, street: v })} />
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="City" placeholderTextColor={colors.textLight} value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="State" placeholderTextColor={colors.textLight} value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Pincode" placeholderTextColor={colors.textLight} value={form.pincode} onChangeText={(v) => setForm({ ...form, pincode: v })} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Landmark (optional)" placeholderTextColor={colors.textLight} value={form.landmark} onChangeText={(v) => setForm({ ...form, landmark: v })} />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
            <Text style={styles.saveText}>Save Address</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={addresses}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>📍</Text>
                  <Text style={styles.emptyTitle}>No addresses saved</Text>
                  <Text style={styles.emptyText}>Add an address for delivery</Text>
                </View>
              ) : <ActivityIndicator color={colors.primary} />
            }
          />
          <View style={styles.footer}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+ Add New Address</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md },
  backBtn: { fontSize: 32, color: colors.text, fontWeight: '300' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  addressCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  addressHeader: { marginBottom: spacing.sm },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center' },
  labelIcon: { fontSize: 16, marginRight: spacing.sm },
  addressLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  defaultBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: 4, marginLeft: spacing.sm },
  defaultText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  addressText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  landmark: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  addressActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  deleteText: { color: colors.error, fontSize: 13, fontWeight: '500' },
  formContainer: { padding: spacing.xl },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  labelRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  labelOption: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  labelOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  labelOptionText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  labelOptionTextActive: { color: colors.primary },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: 14, color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.md },
  saveText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: spacing.lg },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight },
  addBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
