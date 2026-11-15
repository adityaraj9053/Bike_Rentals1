import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { ArrowLeft, Bike, ShieldCheck } from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import OwnerDashboardView from '../components/OwnerDashboardView';

export default function BuyerDetailsScreen({
  navigation,
  user,
  onSignOut,
  onShowToast,
  sharedBikes = [],
}) {
  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.() || navigation?.navigate?.('Home')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#38BDF8" />
          <Text style={styles.backButtonText}>Back to Fleet</Text>
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <ShieldCheck size={14} color="#34D399" />
          <Text style={styles.pageIndicatorText}>Owner Access</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation?.navigate?.('RentBike')}
          activeOpacity={0.7}
        >
          <Bike size={14} color="#38BDF8" />
          <Text style={styles.actionBtnText}>+ Add Bike</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <OwnerDashboardView
          user={user}
          onSignOut={onSignOut}
          onShowToast={onShowToast}
          sharedBikes={sharedBikes}
          onNavigateToRentBike={(bikeToEdit) =>
            navigation?.navigate?.('RentBike', bikeToEdit ? { bikeToEdit } : undefined)
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  backButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  pageIndicatorText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  actionBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
});

