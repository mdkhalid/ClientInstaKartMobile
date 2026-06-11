import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { productApi, wishlistApi } from '../../src/api';
import { getImageUrl } from '../../src/api/client';
import { useCartStore } from '../../src/store/cart';
import { useLocationStore } from '../../src/store/location';
import type { Product } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { lat, lng } = useLocationStore();

  const loadProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await productApi.getBySlug(slug, lat ?? undefined, lng ?? undefined);
      const p = res.data.data;
      if (p) {
        setProduct(p);
        try {
          const wishRes = await wishlistApi.check([p.id]);
          setInWishlist(wishRes.data.data?.[p.id] ?? false);
        } catch {}
      }
    } catch {}
    setLoading(false);
  }, [slug, lat, lng]);

  useFocusEffect(useCallback(() => { loadProduct(); }, [loadProduct]));

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem(product.id, 1, lat ?? undefined, lng ?? undefined);
      router.push('/(tabs)/cart');
    } catch {} finally { setAddingToCart(false); }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const res = await wishlistApi.toggle(product.id);
      setInWishlist(res.data.data?.inWishlist ?? !inWishlist);
    } catch {}
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
  );

  if (!product) return (
    <View style={styles.center}>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.errorText}>Product not found — tap to go back</Text></TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity onPress={handleToggleWishlist} style={styles.iconBtn}><Text style={styles.wishlistIcon}>{inWishlist ? '❤️' : '🤍'}</Text></TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {product.discountPercent > 0 && <View style={styles.discountBadge}><Text style={styles.discountText}>-{product.discountPercent}%</Text></View>}
        {product.images?.[0]?.url ? <Image source={{ uri: getImageUrl(product.images[0].url) }} style={styles.productImage} resizeMode="contain" />
          : <View style={styles.center}><Text style={{ fontSize: 48 }}>📦</Text></View>}
      </View>

      <View style={styles.details}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        <View style={styles.row}>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.rating}>{product.rating || 0}</Text>
            <Text style={styles.light}>({product.reviewsCount || 0})</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          {product.salePrice ? (
            <><Text style={styles.salePrice}>₹{product.salePrice}</Text><Text style={styles.origPrice}>₹{product.price}</Text></>
          ) : <Text style={styles.price}>₹{product.price}</Text>}
        </View>

        <Text style={[styles.stock, { color: product.stock > 0 ? colors.success : colors.error }]}>
          {product.stock > 0 ? `✅ ${product.stock} in stock` : '❌ Out of stock'}
        </Text>

        {product.shortDesc ? <Text style={styles.desc}>{product.shortDesc}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, (!product.isAvailable || product.stock <= 0) && styles.btnDisabled]}
          onPress={handleAddToCart}
          disabled={!product.isAvailable || product.stock <= 0 || addingToCart}
        >
          {addingToCart ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Add to Cart • ₹{product.salePrice || product.price}</Text>}
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 28, color: colors.text, lineHeight: 30 },
  wishlistIcon: { fontSize: 22 },
  imageContainer: { height: 280, margin: spacing.xl, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.primaryBg },
  productImage: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: spacing.md, left: spacing.md, backgroundColor: colors.discount, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 4, zIndex: 1 },
  discountText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  details: { paddingHorizontal: spacing.xl },
  productName: { fontSize: 22, fontWeight: '700', color: colors.text },
  unit: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  star: { fontSize: 14 },
  rating: { fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 4 },
  light: { fontSize: 13, color: colors.textLight, marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  price: { fontSize: 28, fontWeight: '800', color: colors.text },
  salePrice: { fontSize: 28, fontWeight: '800', color: colors.sale },
  origPrice: { fontSize: 16, color: colors.textLight, textDecorationLine: 'line-through', marginLeft: spacing.md },
  stock: { fontSize: 13, fontWeight: '500', marginTop: spacing.md },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.lg },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.xxl },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
