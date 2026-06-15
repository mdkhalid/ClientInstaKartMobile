import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { userApi } from '../../src/api';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current || !newPwd) { Alert.alert('Error', 'Fill all fields'); return; }
    if (newPwd.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPwd)) { Alert.alert('Error', 'Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(newPwd)) { Alert.alert('Error', 'Password must contain at least one number'); return; }
    if (newPwd !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      await userApi.changePassword(current, newPwd);
      Alert.alert('Success', 'Password changed successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ fontSize: 28, color: colors.text }}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.pwdRow}>
            <TextInput style={styles.pwdInput} placeholder="Enter current password" placeholderTextColor={colors.textLight} value={current} onChangeText={setCurrent} secureTextEntry={!showCurrent} />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eye}><Text>{showCurrent ? '👁️' : '👁️‍🗨️'}</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.pwdRow}>
            <TextInput style={styles.pwdInput} placeholder="Enter new password" placeholderTextColor={colors.textLight} value={newPwd} onChangeText={setNewPwd} secureTextEntry={!showNew} />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eye}><Text>{showNew ? '👁️' : '👁️‍🗨️'}</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput style={styles.input} placeholder="Confirm new password" placeholderTextColor={colors.textLight} value={confirm} onChangeText={setConfirm} secureTextEntry />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleChange} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  content: { padding: spacing.xl },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 15, color: colors.text },
  pwdRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md },
  pwdInput: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 15, color: colors.text },
  eye: { paddingHorizontal: spacing.md, paddingVertical: 14 },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
