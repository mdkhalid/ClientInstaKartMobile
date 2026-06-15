import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one number');
      return;
    }
    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>InstaKart</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join InstaKart today</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput style={styles.input} placeholder="John" placeholderTextColor={colors.textLight} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} placeholder="Doe" placeholderTextColor={colors.textLight} value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor={colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput style={styles.input} placeholder="Enter your phone" placeholderTextColor={colors.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={styles.passwordInput} placeholder="Create a password" placeholderTextColor={colors.textLight} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput style={styles.passwordInput} placeholder="Confirm your password" placeholderTextColor={colors.textLight} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={styles.eyeIcon}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  logo: { fontSize: 32, fontWeight: '800', color: colors.primary },
  form: { flex: 1, paddingHorizontal: spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  row: { flexDirection: 'row', gap: spacing.md },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: { paddingHorizontal: spacing.md, paddingVertical: 14 },
  eyeIcon: { fontSize: 18 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, marginBottom: 40 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
