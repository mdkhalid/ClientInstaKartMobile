import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { userApi, orderApi, cartApi, paymentApi } from '../../src/api';
import { getImageUrl, trackEvent } from '../../src/api/client';
import { useCartStore } from '../../src/store/cart';
import { useStoreStore } from '../../src/store/store';
import type { Address } from '../../src/types';
import { colors, spacing, borderRadius } from '../../src/theme';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
  { id: 'UPI', label: 'UPI', icon: '📱', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'RAZORPAY', label: 'Card / NetBanking', icon: '💳', desc: 'Credit, Debit & NetBanking' },
];

export default function CheckoutScreen() {
  const { cart, fetch } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(),
      userApi.getAddresses().then(r => {
        const addrs = r.data.data ?? [];
        setAddresses(addrs);
        const def = addrs.find(a => a.isDefault);
        if (def) setSelectedAddress(def.id);
        else if (addrs.length > 0) setSelectedAddress(addrs[0].id);
      }),
    ]).finally(() => setLoading(false));
  }, []));

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await cartApi.applyCoupon(couponCode.trim());
      setCouponApplied(res.data.success);
      setCouponMsg(res.data.success ? 'Coupon applied!' : 'Invalid coupon');
    } catch (err: any) {
      setCouponMsg(err.response?.data?.message || 'Invalid coupon');
      setCouponApplied(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { Alert.alert('Select Address', 'Please select a delivery address'); return; }
    if (!cart || cart.items.length === 0) { Alert.alert('Cart Empty', 'Add items to your cart first'); return; }

    setPlacing(true);
    trackEvent('checkout_start');
    try {
      const storeId = useStoreStore.getState().currentStore?.id;
      const payload: any = { addressId: selectedAddress, paymentMethod, storeId };
      if (couponApplied) payload.couponCode = couponCode.trim();

      const res = await orderApi.create(payload);
      const order = res.data.data;
      trackEvent('checkout_complete');

      if (paymentMethod === 'COD') {
        Alert.alert('Order Placed!', `Order ${order.orderNumber} placed successfully. Pay on delivery.`, [
          { text: 'View Orders', onPress: () => router.push('/(tabs)/orders') },
        ]);
      } else {
        // For online payment, get payment intent
        try {
          const payRes = await paymentApi.create(order.id, paymentMethod);
          const payData = payRes.data.data;
          // Show payment info — in production this would open a WebView/checkout
          Alert.alert(
            'Payment Initiated',
            `Order ${order.orderNumber} created. Complete payment of ₹${order.total} via ${paymentMethod}.\n\nPayment ID: ${payData.paymentId}`,
            [{ text: 'View Orders', onPress: () => router.push('/(tabs)/orders') }]
          );
        } catch {
          Alert.alert('Order Created', `Order ${order.orderNumber} created. Complete payment in Orders section.`, [
            { text: 'View Orders', onPress: () => router.push('/(tabs)/orders') },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    }
    setPlacing(false);
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ fontSize: 28, color: colors.text }}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length === 0 ? (
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => router.push('/address')}>
              <Text style={styles.addAddressText}>+ Add Address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map(a => (
              <TouchableOpacity key={a.id} style={[styles.addressCard, selectedAddress === a.id && styles.addressSelected]}
                onPress={() => setSelectedAddress(a.id)}>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>{a.label}</Text>
                  {a.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                  {selectedAddress === a.id && <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={styles.addressText}>{a.street}, {a.city}</Text>
                <Text style={styles.addressText}>{a.state} - {a.pincode}</Text>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity onPress={() => router.push('/address')} style={{ marginTop: spacing.sm }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>+ Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity key={m.id} style={[styles.paymentCard, paymentMethod === m.id && styles.paymentSelected]}
              onPress={() => setPaymentMethod(m.id)}>
              <Text style={{ fontSize: 22, marginRight: spacing.md }}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>{m.label}</Text>
                <Text style={styles.paymentDesc}>{m.desc}</Text>
              </View>
              <View style={[styles.radio, paymentMethod === m.id && styles.radioSelected]}>
                {paymentMethod === m.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <View style={styles.couponRow}>
            <TextInput style={styles.couponInput} placeholder="Enter coupon code" placeholderTextColor={colors.textLight}
              value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />
            <TouchableOpacity style={[styles.applyBtn, couponApplied && { backgroundColor: colors.success }]} onPress={handleApplyCoupon}>
              <Text style={styles.applyText}>{couponApplied ? '✓' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
          {couponMsg ? <Text style={{ fontSize: 12, color: couponApplied ? colors.success : colors.error, marginTop: 4 }}>{couponMsg}</Text> : null}
        </View>

        {/* Summary */}
        {cart && cart.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary ({cart.itemCount} items)</Text>
            {cart.items.map(item => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.orderItemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalAmount}>₹{cart.subtotal}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.placeBtn, (!selectedAddress || !cart || cart.items.length === 0) && { opacity: 0.5 }]}
          onPress={handlePlaceOrder} disabled={placing || !selectedAddress || !cart || cart.items.length === 0}>
          {placing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.placeText}>Place Order • {paymentMethod === 'COD' ? 'COD' : 'Online'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  section: { padding: spacing.xl, marginBottom: spacing.sm, backgroundColor: colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  addAddressBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', borderStyle: 'dashed' },
  addAddressText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  addressCard: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  addressSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  addressLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  defaultBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: spacing.sm, borderRadius: 4 },
  defaultText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  addressText: { fontSize: 12, color: colors.textSecondary },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  paymentSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  paymentLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  paymentDesc: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  couponInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.text, marginRight: spacing.sm },
  applyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: borderRadius.md },
  applyText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  orderItemName: { flex: 1, fontSize: 13, color: colors.text },
  orderItemQty: { fontSize: 13, color: colors.textSecondary, marginHorizontal: spacing.md },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
  totalAmount: { fontSize: 20, fontWeight: '800', color: colors.primary },
  footer: { padding: spacing.xl, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight },
  placeBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center' },
  placeText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
