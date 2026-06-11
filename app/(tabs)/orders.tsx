import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { orderApi } from '../../src/api';
import type { Order } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: colors.primary,
  PREPARING: '#3b82f6',
  OUT_FOR_DELIVERY: '#8b5cf6',
  DELIVERED: '#059669',
  CANCELLED: '#ef4444',
  REFUNDED: '#6b7280',
};

const statusIcons: Record<string, string> = {
  PENDING: '⏳',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  OUT_FOR_DELIVERY: '🚚',
  DELIVERED: '📦',
  CANCELLED: '❌',
  REFUNDED: '💳',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = useCallback(async (p: number = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const res = await orderApi.list({ page: p, limit: 10 });
      const body = res.data.data as any;
      const orderList = body?.orders ?? [];
      if (p === 1) {
        setOrders(orderList);
      } else {
        setOrders((prev) => [...prev, ...orderList]);
      }
      setHasMore(p < (body?.pagination?.totalPages ?? 1));
      setPage(p);
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders(1);
    }, [])
  );

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => router.push(`/orders/${item.id}`)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#6b7280') + '20' }]}>
          <Text style={styles.statusIcon}>{statusIcons[item.status] || '📄'}</Text>
          <Text style={[styles.statusText, { color: statusColors[item.status] || '#6b7280' }]}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      <Text style={styles.itemsText}>{item.items.length} item(s) • ₹{item.total}</Text>
      <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      {item.estimatedDelivery && (
        <Text style={styles.deliveryText}>🚚 Est. {new Date(item.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(1, true)} tintColor={colors.primary} />}
        onEndReached={() => { if (hasMore && !loading) fetchOrders(page + 1); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Your orders will appear here</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  orderCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orderNumber: { fontSize: 14, fontWeight: '700', color: colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4 },
  statusIcon: { fontSize: 11, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  itemsText: { fontSize: 13, color: colors.textSecondary },
  dateText: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  deliveryText: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xxl },
  shopBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  shopBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
