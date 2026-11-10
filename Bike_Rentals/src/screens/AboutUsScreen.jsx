import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Award,
  Heart,
  Wrench,
  ShieldCheck,
  Bike,
  ArrowRight,
} from 'lucide-react-native';
import { IMAGES } from '../assets/images';
import { COLORS, RADIUS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

export default function AboutUsScreen({ navigation }) {
  const { t } = useLanguage();

  const values = [
    {
      title: t('about.value1Title'),
      desc: t('about.value1Desc'),
      icon: Award,
    },
    {
      title: t('about.value2Title'),
      desc: t('about.value2Desc'),
      icon: Heart,
    },
    {
      title: t('about.value3Title'),
      desc: t('about.value3Desc'),
      icon: Wrench,
    },
    {
      title: t('about.value4Title'),
      desc: t('about.value4Desc'),
      icon: ShieldCheck,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.pretitle}>{t('about.pretitle')}</Text>
          <Text style={styles.title}>{t('about.title')}</Text>
          <Text style={styles.subtitle}>{t('about.subtitle')}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{t('about.stat1Num')}</Text>
            <Text style={styles.statLabel}>{t('about.stat1Label')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{t('about.stat2Num')}</Text>
            <Text style={styles.statLabel}>{t('about.stat2Label')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{t('about.stat3Num')}</Text>
            <Text style={styles.statLabel}>{t('about.stat3Label')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{t('about.stat4Num')}</Text>
            <Text style={styles.statLabel}>{t('about.stat4Label')}</Text>
          </View>
        </View>

        {/* Story Card */}
        <View style={styles.storyCard}>
          <Image
            source={IMAGES['workshop']}
            style={styles.storyImg}
            resizeMode="cover"
          />
          <View style={styles.storyContent}>
            <Text style={styles.storyPretitle}>{t('about.foundationPretitle')}</Text>
            <Text style={styles.storyTitle}>{t('about.foundationTitle')}</Text>
            <Text style={styles.storyText}>
              {t('about.foundationText1')}{'\n\n'}{t('about.foundationText2')}
            </Text>
          </View>
        </View>

        {/* Values 2x2 Grid */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionTitle}>{t('about.whatSetsUsApart')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('about.whatSetsUsApartSub')}
          </Text>

          <View style={styles.valuesGrid}>
            {values.map((v, i) => {
              const IconComp = v.icon;
              return (
                <View key={i} style={styles.valueCard}>
                  <View style={styles.valueIconCircle}>
                    <IconComp size={22} color={COLORS.accentCyan} />
                  </View>
                  <Text style={styles.valueTitle}>{v.title}</Text>
                  <Text style={styles.valueDesc}>{v.desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Browse Fleet Button */}
        <View style={styles.ctaBtnWrapper}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation?.navigate('Motorbikes')}
            activeOpacity={0.8}
          >
            <Bike size={18} color="#FFFFFF" />
            <Text style={styles.ctaBtnText}>{t('about.browseFleetBtn')}</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  contentContainer: {
    paddingBottom: 50,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    marginBottom: 28,
  },
  pretitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    maxWidth: 700,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statNum: {
    fontSize: 30,
    fontWeight: '900',
    color: '#38BDF8',
  },
  statLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.8,
  },
  storyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    marginBottom: 36,
  },
  storyImg: {
    width: '100%',
    height: 240,
  },
  storyContent: {
    padding: 24,
  },
  storyPretitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  storyText: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  valuesSection: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  valueCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 22,
  },
  valueIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  valueDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  ctaBtnWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  ctaBtn: {
    backgroundColor: '#0284C7',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
