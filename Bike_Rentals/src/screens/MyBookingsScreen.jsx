import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { ArrowLeft, Bike } from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import UserBookingsView from '../components/UserBookingsView';

export default function MyBookingsScreen({
  navigation,
  user,
  onSignOut,
  onShowToast,
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

        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation?.navigate?.('Motorbikes')}
          activeOpacity={0.7}
        >
          <Bike size={14} color="#38BDF8" />
          <Text style={styles.exploreBtnText}>Browse Bikes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <UserBookingsView
          user={user}
          onSignOut={onSignOut}
          onShowToast={onShowToast}
          onExploreBikes={() => navigation?.navigate?.('Motorbikes')}
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
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  exploreBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
});

