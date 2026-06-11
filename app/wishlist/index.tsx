import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { wishlistApi } from '../../src/api';
import { getImageUrl } from '../../src/api/client';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function WishlistScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    wishlistApi.get().then(r => setItems(r.data.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const handleRemove = async (productId: string) => {
    await wishlistApi.remove(productId);
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${item.product.slug}`)}>
      <View style={styles.imageContainer}>
        {item.product.image ? (
          <Image source={{ uri: getImageUrl(item.product.image) }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}><Text style={{ fontSize: 28 }}>📦</Text></View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
        {item.product.discountPercent > 0 && (
          <View style={styles.discountBadge}><Text style={styles.discountText}>-{item.product.discountPercent}%</Text></View>
        )}
        <View style={styles.priceRow}>
          {item.product.salePrice ? (
            <><Text style={styles.salePrice}>₹{item.product.salePrice}</Text><Text style={styles.origPrice}>₹{item.product.price}</Text></>
          ) : (
            <Text style={styles.price}>₹{item.product.price}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.productId)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ fontSize: 28, color: colors.text }}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          await wishlistApi.get().then(r => setItems(r.data.data ?? [])).catch(() => {});
          setRefreshing(false);
        }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>🤍</Text>
            <Text style={styles.emptyTitle}>Wishlist is empty</Text>
            <Text style={styles.emptyText}>Save items you love</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.shopBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  imageContainer: { width: 80, height: 80, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: colors.primaryBg },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '500', color: colors.text, lineHeight: 18 },
  discountBadge: { backgroundColor: colors.discount, alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginTop: 4 },
  discountText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: colors.text },
  salePrice: { fontSize: 16, fontWeight: '700', color: colors.sale },
  origPrice: { fontSize: 12, color: colors.textLight, textDecorationLine: 'line-through', marginLeft: 4 },
  removeBtn: { marginTop: spacing.sm },
  removeText: { color: colors.error, fontSize: 12, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xxl },
  shopBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  shopBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
