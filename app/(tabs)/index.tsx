import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { productApi, categoryApi, wishlistApi } from '../../src/api';
import { getImageUrl } from '../../src/api/client';
import { useCartStore } from '../../src/store/cart';
import { useLocationStore } from '../../src/store/location';
import { useStoreStore } from '../../src/store/store';
import type { Product, Category } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

function ProductCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  useEffect(() => {
    wishlistApi.check([product.id]).then(r => setWished(r.data.data?.[product.id] ?? false)).catch(() => {});
  }, [product.id]);
  return (
    <View style={styles.productCard}>
      <TouchableOpacity onPress={() => router.push(`/product/${product.slug}`)}>
        <View style={styles.productImageContainer}>
          {product.discountPercent > 0 && (
            <View style={styles.discountBadge}><Text style={styles.discountText}>-{product.discountPercent}%</Text></View>
          )}
          {product.images?.[0]?.url ? (
            <Image source={{ uri: getImageUrl(product.images[0].url) }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}><Text style={{ fontSize: 28 }}>📦</Text></View>
          )}
          <TouchableOpacity style={styles.cardWishlist} onPress={() => {
            wishlistApi.toggle(product.id).then(r => setWished(r.data.data?.inWishlist ?? !wished)).catch(() => {});
          }}>
            <Text style={{ fontSize: 16 }}>{wished ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <View style={styles.productInfo}>
        <TouchableOpacity onPress={() => router.push(`/product/${product.slug}`)}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        </TouchableOpacity>
        <View style={styles.priceRow}>
          {product.salePrice ? (
            <><Text style={styles.salePrice}>₹{product.salePrice}</Text><Text style={styles.originalPrice}>₹{product.price}</Text></>
          ) : (
            <Text style={styles.price}>₹{product.price}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addSmallBtn} onPress={() => addItem(product.id, 1).catch(() => {})}>
          <Text style={styles.addSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchCart = useCartStore((s) => s.fetch);
  const cartCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const { lat, lng, address, loading: locLoading, requestLocation } = useLocationStore();
  const { currentStore, availableStores, setStore, notServiceable, loading: storeLoading } = useStoreStore();
  const [showStores, setShowStores] = useState(false);

  const fetchData = useCallback(async (locLat?: number, locLng?: number) => {
    const storeId = useStoreStore.getState().currentStore?.id;
    try {
      const [trendingRes, featuredRes, catRes] = await Promise.all([
        productApi.trending(locLat, locLng, storeId),
        productApi.featured(locLat, locLng, storeId),
        categoryApi.popular(),
      ]);
      setTrending(trendingRes.data.data ?? []);
      setFeatured(featuredRes.data.data ?? []);
      setCategories(catRes.data.data ?? []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    if (lat !== null && lng !== null) {
      Promise.all([fetchData(lat, lng), fetchCart()]).finally(() => setLoading(false));
    } else if (!locLoading) {
      requestLocation();
      Promise.all([fetchData(), fetchCart()]).finally(() => setLoading(false));
    } else {
      fetchCart();
      setLoading(false);
    }
  }, [lat, lng, locLoading]));

  const onRefresh = async () => {
    setRefreshing(true);
    const ll = lat !== null && lng !== null ? { lat, lng } : null;
    await Promise.all([fetchData(ll?.lat, ll?.lng), fetchCart()]);
    setRefreshing(false);
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Deliver to</Text>
            <TouchableOpacity onPress={requestLocation}>
              <Text style={styles.location} numberOfLines={1}>📍 {address || (locLoading ? 'Getting location...' : 'Set Location')}</Text>
            </TouchableOpacity>
            {/* Store Selector */}
            {currentStore && (
              <TouchableOpacity style={styles.storeRow} onPress={() => setShowStores(!showStores)}>
                <Text style={styles.storeName}>🏪 {currentStore.name}</Text>
                <Text style={{ fontSize: 10, color: colors.textLight }}>▼</Text>
              </TouchableOpacity>
            )}
            {notServiceable && !storeLoading && (
              <Text style={styles.notServiceable}>⚠️ No store serves your area</Text>
            )}
            {storeLoading && <Text style={{ fontSize: 11, color: colors.textLight }}>Finding nearby stores...</Text>}
          </View>
          <TouchableOpacity style={styles.cartIconWrap} onPress={() => router.push('/(tabs)/cart')}>
            <Text style={{ fontSize: 22 }}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartCount}><Text style={styles.cartCountText}>{cartCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileIconWrap} onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.profileCircle}><Text style={styles.profileInitial}>👤</Text></View>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 15, color: colors.textLight }}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search groceries..." placeholderTextColor={colors.textLight}
            onFocus={() => router.push('/(tabs)/search')} />
        </View>

        {/* Store Switcher Dropdown */}
        {showStores && availableStores.length > 1 && (
          <>
            <TouchableOpacity style={styles.overlay} onPress={() => setShowStores(false)} />
            <View style={styles.dropdown}>
              <Text style={styles.dropdownTitle}>Switch Store</Text>
              {availableStores.map(s => (
                <TouchableOpacity key={s.id} style={[styles.dropdownItem, currentStore?.id === s.id && styles.dropdownItemActive]}
                  onPress={() => { setStore(s); setShowStores(false); }}>
                  <Text style={[styles.dropdownName, currentStore?.id === s.id && { color: colors.primary, fontWeight: '700' }]}>{s.name}</Text>
                  <Text style={styles.dropdownCity}>{s.city} • ₹{s.deliveryFee} delivery</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>WEEKLY DEALS</Text>
            <Text style={styles.heroTitle}>Fresh & Organic{'\n'}Groceries</Text>
            <Text style={styles.heroSubtitle}>Up to 30% off on your first order</Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.heroButtonText}>Shop Now →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroImageWrap}>
            <Text style={{ fontSize: 64 }}>🛍️</Text>
          </View>
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.xl }}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryCard}
                  onPress={() => router.push(`/(tabs)/search?category=${cat.slug}`)}>
                  <View style={styles.categoryIconWrap}>
                    <Text style={{ fontSize: 28 }}>📂</Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>{cat.productsCount || 0} items</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Trending</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.xl }}>
              {trending.map((p) => <ProductCard key={p.id} product={p} />)}
            </ScrollView>
          </View>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ Featured</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            <View style={styles.featuredGrid}>
              {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // Header
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  greeting: { fontSize: 11, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  location: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  cartIconWrap: { padding: spacing.sm, position: 'relative' },
  cartCount: { position: 'absolute', top: 2, right: 2, backgroundColor: colors.error, borderRadius: 9, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  cartCountText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  profileIconWrap: { padding: spacing.sm },
  profileCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center' },
  profileInitial: { fontSize: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, gap: spacing.sm },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
  // Hero
  hero: { flexDirection: 'row', margin: spacing.xl, padding: spacing.xl, backgroundColor: colors.primary, borderRadius: borderRadius.xl, alignItems: 'center', overflow: 'hidden' },
  heroContent: { flex: 1 },
  heroTag: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: spacing.sm },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.white, lineHeight: 28 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, marginBottom: spacing.lg },
  heroButton: { backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignSelf: 'flex-start' },
  heroButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  heroImageWrap: { marginLeft: spacing.lg },
  // Sections
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingHorizontal: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  // Categories
  categoryCard: { alignItems: 'center', marginRight: spacing.lg, width: 80 },
  categoryIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  categoryName: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  categoryCount: { fontSize: 10, color: colors.textLight, marginTop: 2 },
  // Product Cards
  productCard: { width: 152, marginRight: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  productImageContainer: { height: 132, backgroundColor: colors.primaryBg, position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardWishlist: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  productImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.discount, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 1 },
  discountText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  productInfo: { padding: spacing.sm },
  productName: { fontSize: 12, fontWeight: '500', color: colors.text, lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
  salePrice: { fontSize: 15, fontWeight: '700', color: colors.sale },
  originalPrice: { fontSize: 11, color: colors.textLight, textDecorationLine: 'line-through', marginLeft: 4 },
  addSmallBtn: { backgroundColor: colors.primaryBg, borderRadius: 6, paddingVertical: 4, alignItems: 'center', marginTop: spacing.sm, borderWidth: 1, borderColor: colors.primary },
  addSmallText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.md },
  // Store
  storeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  storeName: { fontSize: 12, fontWeight: '500', color: colors.primary },
  notServiceable: { fontSize: 11, color: colors.error, marginTop: 2 },
  overlay: { position: 'absolute', top: 0, left: -spacing.xl, right: -spacing.xl, bottom: -1000, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 20, padding: spacing.md, marginTop: 4 },
  dropdownTitle: { fontSize: 13, fontWeight: '700', color: colors.textLight, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  dropdownItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dropdownItemActive: { backgroundColor: colors.primaryBg, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
  dropdownName: { fontSize: 14, fontWeight: '600', color: colors.text },
  dropdownCity: { fontSize: 11, color: colors.textLight, marginTop: 2 },
});
