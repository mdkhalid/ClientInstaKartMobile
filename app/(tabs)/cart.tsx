import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCartStore } from '../../src/store/cart';
import { getImageUrl } from '../../src/api/client';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function CartScreen() {
  const { cart, fetch, updateItem, removeItem, isLoading } = useCartStore();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [])
  );

  const handleQuantity = async (productId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
      ]);
      return;
    }
    setLoading(true);
    try {
      await updateItem(productId, newQty);
    } catch { /* silent */ }
    setLoading(false);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.product.imageUrl ? (
          <Image source={{ uri: getImageUrl(item.product.imageUrl) }} style={styles.itemImage} />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={{ fontSize: 24 }}>📦</Text></View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantity(item.productId, item.quantity, -1)} disabled={loading}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantity(item.productId, item.quantity, 1)} disabled={loading}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items to get started</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
        <Text style={styles.headerCount}>{cart.itemCount} items</Text>
      </View>

      <FlatList
        data={cart.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalAmount}>₹{cart.subtotal}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  headerCount: { fontSize: 14, color: colors.textSecondary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 180 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImageContainer: { width: 64, height: 64, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: colors.primaryBg },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.text },
  itemUnit: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: colors.primary },
  qtyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginHorizontal: spacing.md, minWidth: 20, textAlign: 'center' },
  footer: {
    padding: spacing.xl, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  totalLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
  totalAmount: { fontSize: 20, fontWeight: '800', color: colors.primary },
  checkoutBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  checkoutText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  emptyContainer: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xxl },
  shopBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.md, borderRadius: borderRadius.md,
  },
  shopBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
