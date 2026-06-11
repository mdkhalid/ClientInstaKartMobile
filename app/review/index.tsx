import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { reviewApi } from '../../src/api';
import { colors, spacing, borderRadius } from '../../src/theme';

const RATINGS = [1, 2, 3, 4, 5];

export default function WriteReviewScreen() {
  const { productId, productName } = useLocalSearchParams<{ productId: string; productName: string }>();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Rating required', 'Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await reviewApi.create({ productId: productId!, rating, title: title.trim() || undefined, comment: comment.trim() || undefined });
      Alert.alert('Thank you!', 'Your review has been submitted.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ fontSize: 28, color: colors.text }}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.productName} numberOfLines={2}>{productName}</Text>

        <Text style={styles.label}>Rating</Text>
        <View style={styles.stars}>
          {RATINGS.map(n => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Text style={{ fontSize: 32, marginRight: spacing.sm }}>{n <= rating ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Title (optional)</Text>
        <TextInput style={styles.input} placeholder="Summarize your review" placeholderTextColor={colors.textLight}
          value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Review (optional)</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Tell others about your experience..." placeholderTextColor={colors.textLight}
          value={comment} onChangeText={setComment} multiline numberOfLines={4} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Submit Review</Text>}
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
  productName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xl },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  stars: { flexDirection: 'row', marginBottom: spacing.xxl },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14, color: colors.text, marginBottom: spacing.lg },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
