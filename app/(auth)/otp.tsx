import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, borderRadius } from '../../src/theme';
import { authApi } from '../../src/api';

export default function OtpLoginScreen() {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const { loginWithOtp, isLoading } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    return () => setDevOtp('');
  }, []);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Error', 'Enter a valid 10-digit phone number');
      return;
    }
    setSending(true);
    try {
      const res = await authApi.sendOtp(cleaned);
      const returnedOtp = res.data.data?.otp;
      if (returnedOtp) setDevOtp(returnedOtp);
      setOtpSent(true);
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    }
    setSending(false);
  };

  const doLogin = async (otpCode: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    try {
      await loginWithOtp(cleaned, otpCode);
      requestAnimationFrame(() => router.replace('/(tabs)'));
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setCode(['', '', '', '', '', '']);
    }
  };

  const handleCodeInput = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && text) {
      const fullOtp = newCode.join('');
      if (fullOtp.length === 6) doLogin(fullOtp);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>InstaKart</Text>
          <Text style={styles.tagline}>Instant grocery delivery</Text>
        </View>

        <Text style={styles.title}>{otpSent ? 'Enter OTP' : 'Login with Phone'}</Text>
        <Text style={styles.subtitle}>
          {otpSent
            ? `Enter the 6-digit code sent to +91 ${phone.replace(/[^0-9]/g, '').replace(/(\d{5})(\d{5})/, '$1 $2')}`
            : 'Enter your phone number to receive a code'}
        </Text>

        {!otpSent ? (
          <>
            <View style={styles.phoneRow}>
              <Text style={styles.ccode}>🇮🇳 +91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                placeholderTextColor={colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={sending}>
              {sending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.otpRow}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(t) => handleCodeInput(t, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !digit && i > 0) {
                      inputRefs.current[i - 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>
            {isLoading && <ActivityIndicator style={{ marginTop: 12 }} color={colors.primary} />}
            {devOtp ? <Text style={styles.devOtpText}>📱 Dev OTP: {devOtp}</Text> : null}
            <TouchableOpacity style={[styles.resendBtn, timer > 0 && { opacity: 0.4 }]} onPress={handleSendOtp} disabled={timer > 0 || sending}>
              <Text style={styles.resendText}>{timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setOtpSent(false); setCode(['', '', '', '', '', '']); setDevOtp(''); }}>
              <Text style={styles.changePhone}>Change phone number</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Or </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Sign in with Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.xxl },
  backBtn: { paddingTop: 60, paddingBottom: spacing.md },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  header: { alignItems: 'center', paddingBottom: 24 },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  ccode: { fontSize: 16, fontWeight: '600', color: colors.text, marginRight: spacing.md },
  phoneInput: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.text },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text, backgroundColor: colors.white },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  devOtpText: { textAlign: 'center', color: colors.primary, fontSize: 16, fontWeight: '700', marginVertical: spacing.md },
  resendBtn: { alignItems: 'center', paddingVertical: spacing.md },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  changePhone: { textAlign: 'center', color: colors.textSecondary, fontSize: 13, marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
