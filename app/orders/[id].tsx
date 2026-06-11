import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { orderApi } from '../../src/api';
import type { Order } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: colors.primary, PREPARING: '#3b82f6',
  OUT_FOR_DELIVERY: '#8b5cf6', DELIVERED: '#059669', CANCELLED: '#ef4444', REFUNDED: '#6b7280',
};
const statusLabels: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    setLoading(true);
    orderApi.getById(id).then(r => setOrder(r.data.data ?? null)).catch(() => {}).finally(() => setLoading(false));
  }, [id]));

  const handleCancel = () => {
    if (!order) return;
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await orderApi.cancel(order.id);
          const r = await orderApi.getById(order.id);
          setOrder(r.data.data ?? null);
        } catch {}
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Order not found</Text></View>;

  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ fontSize: 28, color: colors.text }}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusIcon}>{statusLabels[order.status]?.[0] || '📄'}</Text>
        <View>
          <Text style={styles.statusLabel}>{statusLabels[order.status] || order.status}</Text>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColors[order.status] || '#6b7280' }]} />
      </View>

      {order.statusHistory?.map((h: any) => (
        <View key={h.id} style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineStatus}>{statusLabels[h.status] || h.status}</Text>
            {h.note ? <Text style={styles.timelineNote}>{h.note}</Text> : null}
            <Text style={styles.timelineDate}>{new Date(h.createdAt).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item: any) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.row}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>₹{order.subtotal}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Delivery</Text><Text style={styles.value}>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'Free'}</Text></View>
        {order.discount > 0 && <View style={styles.row}><Text style={[styles.label, { color: colors.success }]}>Discount</Text><Text style={[styles.value, { color: colors.success }]}>-₹{order.discount}</Text></View>}
        <View style={styles.row}><Text style={styles.label}>Tax</Text><Text style={styles.value}>₹{order.tax}</Text></View>
        <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>₹{order.total}</Text></View>
      </View>

      {order.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addrText}>{order.address.street}, {order.address.city}</Text>
          <Text style={styles.addrText}>{order.address.state} - {order.address.pincode}</Text>
        </View>
      )}

      <Text style={styles.paymentText}>Payment: {order.paymentMethod} • {order.paymentStatus}</Text>

      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  statusBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.white, marginBottom: 1 },
  statusIcon: { fontSize: 24, marginRight: spacing.md },
  statusLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  orderNum: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 'auto' },
  timelineItem: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.white, marginBottom: 1 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4, marginRight: spacing.md },
  timelineContent: { flex: 1 },
  timelineStatus: { fontSize: 14, fontWeight: '500', color: colors.text },
  timelineNote: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  timelineDate: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  section: { padding: spacing.xl, backgroundColor: colors.white, marginTop: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  itemName: { flex: 1, fontSize: 13, color: colors.text },
  itemQty: { fontSize: 13, color: colors.textSecondary, marginHorizontal: spacing.md },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '500', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.md, marginTop: spacing.sm },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  total: { fontSize: 20, fontWeight: '800', color: colors.primary },
  addrText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  paymentText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  cancelBtn: { marginHorizontal: spacing.xl, marginTop: spacing.lg, paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error },
  cancelText: { color: colors.error, fontSize: 14, fontWeight: '600' },
});
