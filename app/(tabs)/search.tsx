import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { productApi } from '../../src/api';
import { getImageUrl } from '../../src/api/client';
import { useLocationStore } from '../../src/store/location';
import type { Product } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function SearchScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { lat, lng } = useLocationStore();

  const fetchProducts = useCallback(async (p: number = 1, search?: string) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, limit: 20 };
      if (search || query) params.search = search || query;
      if (category) params.category = category;
      if (lat !== null && lng !== null) { params.lat = lat; params.lng = lng; }
      if (p === 1) {
        params.featured = true;
      }
      const res = await productApi.list(params);
      const data = res.data.data;
      const items = (data as any)?.products ?? [];
      if (p === 1) {
        setProducts(items);
      } else {
        setProducts((prev) => [...prev, ...items]);
      }
      setHasMore(p < ((data as any)?.pagination?.totalPages ?? 1));
      setPage(p);
    } catch { /* silent */ }
    setLoading(false);
  }, [query, category, lat, lng]);

  useFocusEffect(
    useCallback(() => {
      if (category) {
        fetchProducts(1, query);
      } else {
        fetchProducts(1, '');
      }
    }, [category])
  );

  const handleSearch = () => {
    fetchProducts(1, query);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchProducts(page + 1);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => router.push(`/product/${item.slug}`)}>
      <View style={styles.productImageContainer}>
        {item.discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discountPercent}%</Text>
          </View>
        )}
        {item.images?.[0]?.url ? (
          <Image source={{ uri: item.images[0].url }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholder}><Text style={styles.placeholderIcon}>📦</Text></View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productUnit}>{item.unit}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsCount}>({item.reviewsCount})</Text>
        </View>
        <View style={styles.priceRow}>
          {item.salePrice ? (
            <>
              <Text style={styles.salePrice}>₹{item.salePrice}</Text>
              <Text style={styles.originalPrice}>₹{item.price}</Text>
            </>
          ) : (
            <Text style={styles.price}>₹{item.price}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{category ? `Category` : 'Search Products'}</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groceries, brands..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); fetchProducts(1, ''); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Try a different search term</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.lg,
    backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  clearBtn: { fontSize: 16, color: colors.textLight, padding: 4 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  productItem: {
    width: '48%', backgroundColor: colors.white, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  productImageContainer: { height: 140, backgroundColor: colors.primaryBg },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 32 },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.discount, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 1 },
  discountText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  productInfo: { padding: spacing.md },
  productName: { fontSize: 13, fontWeight: '500', color: colors.text, lineHeight: 18 },
  productUnit: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star: { fontSize: 11 },
  ratingText: { fontSize: 11, fontWeight: '600', color: colors.text, marginLeft: 2 },
  reviewsCount: { fontSize: 11, color: colors.textLight, marginLeft: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 16, fontWeight: '700', color: colors.text },
  salePrice: { fontSize: 16, fontWeight: '700', color: colors.sale },
  originalPrice: { fontSize: 12, color: colors.textLight, textDecorationLine: 'line-through', marginLeft: 6 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
