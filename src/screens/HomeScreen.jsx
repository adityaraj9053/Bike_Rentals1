import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Bike,
  Tag,
  Headphones,
  CalendarCheck,
  ArrowRight,
  MessageCircle,
  Star,
  ShieldCheck,
  Plus,
  Minus,
  Award,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import { BIKES_DATA, CATEGORIES_DATA, FAQS_DATA, TESTIMONIALS_DATA } from '../data/bikes';
import { IMAGES } from '../assets/images';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import BikeCard from '../components/BikeCard';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { useLanguage } from '../i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({
  navigation,
  onSelectBike,
  onStartBooking,
  onOpenWhatsApp,
  onOpenBookModal,
}) {
  const { t, isHindi } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const carouselScrollRef = useRef(null);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleScrollCarousel = (direction) => {
    const cardStep = 306; // 290 card width + 16 gap
    const nextX = direction === 'left'
      ? Math.max(0, carouselOffset - cardStep)
      : carouselOffset + cardStep;
    carouselScrollRef.current?.scrollTo({ x: nextX, animated: true });
    setCarouselOffset(nextX);
  };

  const filteredBikes = BIKES_DATA.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.categoryKey === selectedCategory;
  });

  const getCategoryLabel = (id) => {
    switch (id) {
      case 'all': return t('fleet.allBikes', 'All Bikes');
      case 'scooters': return t('fleet.scooters', 'Scooters');
      case 'commuter': return t('fleet.commuters', 'Commuter Bikes');
      case 'cruiser': return t('fleet.cruisers', 'Cruiser Bikes');
      case 'premium': return t('fleet.premium', 'Premium Bikes');
      default: return id;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HERO SECTION (Centered & Contained) ================= */}
      <View style={styles.heroSection}>
        <Image
          source={IMAGES['hero-bike']}
          style={styles.heroBgImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContainer}>
          <View style={styles.heroTagBadge}>
            <Compass size={13} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.heroTagText}>{t('hero.badge', 'THEROADEAGLE.COM')}</Text>
          </View>

          <Text style={styles.heroTitle}>
            {t('hero.titleLine1', 'Your Ride, Your Route,')}{'\n'}
            <Text style={styles.heroTitleCyan}>{t('hero.titleLine2', 'Your Freedom.')}</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            {t('hero.subtitle', 'Discover the city on two wheels. Find the perfect machine for your journey, from agile urban scooters to highway cruisers and superbikes.')}
          </Text>

          <View style={styles.heroButtons}>
            {/* Explore Bikes button - navigates directly to Motorbikes fleet screen */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => {
                navigation.navigate('Motorbikes');
              }}
              activeOpacity={0.8}
            >
              <Bike size={17} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>{t('hero.exploreBikes', 'Explore Bikes')}</Text>
            </TouchableOpacity>

            {/* List Your Bike & Earn button */}
            <TouchableOpacity
              style={styles.btnRentBikeHero}
              onPress={() => {
                navigation.navigate('RentBike');
              }}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.btnRentBikeHeroText}>Rent Your Bike & Earn</Text>
            </TouchableOpacity>

            {/* WhatsApp Enquiry button - luxury styling with authentic WhatsApp icon */}
            <TouchableOpacity
              style={styles.btnWhatsAppDark}
              onPress={onOpenWhatsApp}
              activeOpacity={0.8}
            >
              <WhatsAppIcon size={14} color="#FFFFFF" withCircle circleSize={24} />
              <Text style={styles.btnWhatsAppDarkText}>{t('hero.whatsappEnquiry', 'WhatsApp Enquiry')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= FEATURE STRIP (Centered on all screen sizes) ================= */}
      <View style={styles.featureStrip}>
        <View style={styles.centerContainer}>
          <View style={styles.featureStripCenteredWrap}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Bike size={16} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.featureTitle}>{t('hero.feature1', 'Multiple Bike Options')}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Tag size={16} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.featureTitle}>{t('hero.feature2', 'Transparent Pricing')}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Headphones size={16} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.featureTitle}>{t('hero.feature3', 'Customer Assistance')}</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <CalendarCheck size={16} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.featureTitle}>{t('hero.feature4', 'Easy Enquiries')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= PHILOSOPHY STATEMENT ================= */}
      <View style={styles.philosophySection}>
        <View style={styles.centerContainer}>
          <Text style={styles.philosophyQuote}>
            {isHindi
              ? '"मोटरसाइकिल किराये पर लेना कोई जोखिम भरा काम नहीं होना चाहिए। हम पारदर्शी मूल्य निर्धारण, फ़ैक्टरी-रखरखाव वाली मशीनें और पूरी मानसिक शांति प्रदान करने के लिए प्रतिबद्ध हैं।"'
              : '"Renting a motorcycle shouldn\'t feel like a leap of faith. We exist to provide transparent pricing, factory-maintained machines, and complete peace of mind."'}
          </Text>
          <Text style={styles.philosophyAuthor}>
            {isHindi ? '— The Road Eagle गारंटी' : '— The Road Eagle Guarantee'}
          </Text>
        </View>
      </View>

      {/* ================= CURATED FLEET SECTION ================= */}
      <View style={styles.fleetSection}>
        <View style={styles.centerContainer}>
          <View style={styles.fleetHeaderRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.sectionPretitle}>{t('fleet.pretitle', 'CURATED LINEUP')}</Text>
              <Text style={styles.sectionTitle}>{t('fleet.title', 'Handpicked Fleet')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('fleet.subtitle', 'Hand-picked machines ready for immediate adventure and daily convenience.')}
              </Text>
            </View>

            {/* Carousel Navigation Arrows */}
            <View style={styles.carouselArrows}>
              <TouchableOpacity
                style={styles.carouselArrowBtn}
                onPress={() => handleScrollCarousel('left')}
                activeOpacity={0.7}
                accessibilityLabel="Previous bikes"
              >
                <ChevronLeft size={18} color={COLORS.accentCyan} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.carouselArrowBtn}
                onPress={() => handleScrollCarousel('right')}
                activeOpacity={0.7}
                accessibilityLabel="Next bikes"
              >
                <ChevronRight size={18} color={COLORS.accentCyan} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsScroll}
          >
            {CATEGORIES_DATA.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    carouselScrollRef.current?.scrollTo({ x: 0, animated: true });
                    setCarouselOffset(0);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                    {getCategoryLabel(cat.id)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Horizontal Carousel of Bike Cards */}
          <View style={styles.carouselWrapper}>
            <ScrollView
              ref={carouselScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              onScroll={(e) => setCarouselOffset(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
            >
              {filteredBikes.map((bike) => (
                <BikeCard
                  key={bike.id}
                  bike={bike}
                  onSelectBike={(b) => {
                    if (onSelectBike) onSelectBike(b);
                    navigation.navigate('BikeDetails', { bike: b });
                  }}
                  onStartBooking={onStartBooking}
                  onOpenBookModal={onOpenBookModal}
                  style={styles.carouselCard}
                />
              ))}

              {filteredBikes.length === 0 && (
                <View style={styles.carouselEmpty}>
                  <Text style={styles.carouselEmptyText}>
                    {isHindi ? 'इस श्रेणी में कोई मोटरसाइकिल उपलब्ध नहीं है।' : 'No motorbikes found in this category.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* View All Bikes CTA - compact & elegant */}
          <View style={styles.viewAllBtnWrapper}>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('Motorbikes')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAllBtnText}>
                {t('fleet.viewAllBtn', `View Complete 50+ Fleet (${filteredBikes.length} available)`)}
              </Text>
              <ArrowRight size={15} color="#38BDF8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= WHY CHOOSE US ================= */}
      <View style={styles.whySection}>
        <View style={styles.centerContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionPretitle}>{t('whyUs.title', 'WHY THE ROAD EAGLE')}</Text>
            <Text style={styles.sectionTitle}>{t('whyUs.title', 'Built for Serious Riders')}</Text>
          </View>

          <View style={styles.whyGrid}>
            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <ShieldCheck size={22} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.whyCardTitle}>{t('whyUs.feature1Title', 'Affordability')}</Text>
              <Text style={styles.whyCardDesc}>{t('whyUs.feature1Desc', '...')}</Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <Tag size={22} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.whyCardTitle}>{t('whyUs.feature2Title', 'Unmatched Satisfaction')}</Text>
              <Text style={styles.whyCardDesc}>{t('whyUs.feature2Desc', '...')}</Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <Headphones size={22} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.whyCardTitle}>{t('whyUs.feature3Title', 'Mechanical Precision')}</Text>
              <Text style={styles.whyCardDesc}>{t('whyUs.feature3Desc', '...')}</Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <Award size={22} color={COLORS.accentCyan} />
              </View>
              <Text style={styles.whyCardTitle}>{t('whyUs.feature4Title', 'Rider Safety First')}</Text>
              <Text style={styles.whyCardDesc}>{t('whyUs.feature4Desc', '...')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= CUSTOMER REVIEWS ================= */}
      <View style={styles.reviewsSection}>
        <View style={styles.centerContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionPretitle}>{isHindi ? 'सत्यापित समीक्षाएं' : 'VERIFIED FEEDBACK'}</Text>
            <Text style={styles.sectionTitle}>{t('testimonials.title', 'Loved by Riders')}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsScroll}
          >
            {TESTIMONIALS_DATA.map((item, idx) => (
              <View key={idx} style={[styles.reviewCard, SHADOWS.card]}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: item.avatar }} style={styles.reviewerAvatar} />
                  <View>
                    <Text style={styles.reviewerName}>{item.name}</Text>
                    <Text style={styles.reviewerCity}>{item.city}</Text>
                  </View>
                </View>

                <View style={styles.reviewStars}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={13} color={COLORS.accentCyan} fill={COLORS.accentCyan} />
                  ))}
                </View>

                <Text style={styles.reviewText}>"{item.review}"</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ================= FAQS ACCORDION ================= */}
      <View style={styles.faqSection}>
        <View style={styles.centerContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionPretitle}>{isHindi ? 'सामान्य प्रश्न' : 'COMMON QUERIES'}</Text>
            <Text style={styles.sectionTitle}>{t('faq.title', 'Frequently Asked Questions')}</Text>
          </View>

          <View style={styles.faqList}>
            {FAQS_DATA.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.faqCard, isOpen && styles.faqCardOpen]}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQuestion, isOpen && styles.faqQuestionActive]}>
                      {faq.question}
                    </Text>
                    {isOpen ? (
                      <Minus size={18} color={COLORS.accentCyan} />
                    ) : (
                      <Plus size={18} color={COLORS.textSecondary} />
                    )}
                  </View>

                  {isOpen && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ================= RENT YOUR BIKE OWNER OPPORTUNITY SECTION ================= */}
      <View style={styles.ownerOpportunitySection}>
        <View style={styles.centerContainer}>
          <View style={styles.ownerOpportunityCard}>
            <View style={styles.ownerOppBadge}>
              <Sparkles size={14} color="#38BDF8" />
              <Text style={styles.ownerOppBadgeText}>EARNING OPPORTUNITY FOR BIKE OWNERS</Text>
            </View>
            <Text style={styles.ownerOppTitle}>
              Rent Your Bike – Turn Your Bike into an Earning Opportunity
            </Text>
            <Text style={styles.ownerOppSub}>
              List your bike, connect with potential renters, and earn by sharing your vehicle with verified riders. We provide complete background KYC, escrow security deposits, and digital rental agreements.
            </Text>

            <View style={styles.ownerPerksRow}>
              <View style={styles.ownerPerkItem}>
                <ShieldCheck size={18} color="#10B981" />
                <Text style={styles.ownerPerkText}>100% KYC Verified Riders</Text>
              </View>
              <View style={styles.ownerPerkItem}>
                <ShieldCheck size={18} color="#10B981" />
                <Text style={styles.ownerPerkText}>Escrow Deposit Protection</Text>
              </View>
              <View style={styles.ownerPerkItem}>
                <ShieldCheck size={18} color="#10B981" />
                <Text style={styles.ownerPerkText}>Guaranteed Daily Payouts</Text>
              </View>
            </View>

            <View style={styles.ownerOppBtns}>
              <TouchableOpacity
                style={styles.ownerListNowBtn}
                onPress={() => navigation.navigate('RentBike')}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.ownerListNowBtnText}>Start Listing Your Bike</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminPortalLinkBtn}
                onPress={() => navigation.navigate('AdminDashboard')}
                activeOpacity={0.8}
              >
                <Shield size={15} color="#38BDF8" />
                <Text style={styles.adminPortalLinkText}>Admin Operations Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ================= BOTTOM LUXURY CTA BANNER ================= */}
      <View style={styles.ctaBannerSection}>
        <View style={styles.centerContainer}>
          <View style={styles.ctaBanner}>
            <Text style={styles.ctaBannerTitle}>
              {isHindi ? 'क्या आप खुली सड़क पर निकलने के लिए तैयार हैं?' : 'Ready to Hit the Open Road?'}
            </Text>
            <Text style={styles.ctaBannerSubtitle}>
              {isHindi
                ? 'आज ही अपनी मनपसंद बाइक आरक्षित करें या तत्काल पुष्टि के लिए व्हाट्सएप पर हमसे संपर्क करें।'
                : 'Reserve your dream machine today or chat with our team on WhatsApp for instant confirmation.'}
            </Text>
            <View style={styles.ctaBannerBtns}>
              <TouchableOpacity
                style={styles.ctaPrimaryBtn}
                onPress={() => navigation.navigate('Motorbikes')}
                activeOpacity={0.8}
              >
                <Bike size={17} color="#FFFFFF" />
                <Text style={styles.ctaPrimaryBtnText}>{t('whyUs.browseFleetBtn', 'Browse Entire Fleet')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaWhatsAppBtn}
                onPress={onOpenWhatsApp}
                activeOpacity={0.8}
              >
                <WhatsAppIcon size={14} color="#FFFFFF" withCircle circleSize={24} />
                <Text style={styles.ctaWhatsAppBtnText}>{t('hero.whatsappEnquiry', 'WhatsApp Concierge')}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  heroSection: {
    height: 520,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050B14',
    overflow: 'hidden',
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.38,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 11, 20, 0.7)',
  },
  heroContainer: {
    width: '100%',
    maxWidth: 1100,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 2,
  },
  heroTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: 16,
  },
  heroTagText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: width < 768 ? 32 : 52,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: width < 768 ? 40 : 60,
    letterSpacing: -1,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroTitleCyan: {
    color: COLORS.accentCyan,
  },
  heroSubtitle: {
    fontSize: width < 768 ? 14 : 16,
    color: COLORS.textSecondary,
    maxWidth: 620,
    lineHeight: 24,
    marginBottom: 28,
    textAlign: 'center',
  },
  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primaryBtn,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: COLORS.primaryBtn,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  btnRentBikeHero: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  btnRentBikeHeroText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  btnWhatsAppDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnWhatsAppDarkText: {
    color: '#34D399',
    fontWeight: '700',
    fontSize: 14,
  },
  featureStrip: {
    backgroundColor: '#0A1222',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 18,
    width: '100%',
  },
  featureStripCenteredWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.2,
  },
  philosophySection: {
    paddingVertical: 36,
    backgroundColor: COLORS.bgDark,
  },
  philosophyQuote: {
    fontSize: width < 768 ? 15 : 18,
    fontStyle: 'italic',
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: width < 768 ? 24 : 30,
    maxWidth: 820,
    alignSelf: 'center',
  },
  philosophyAuthor: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fleetSection: {
    paddingVertical: 30,
    backgroundColor: COLORS.bgDark,
  },
  fleetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionPretitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: width < 768 ? 24 : 30,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    maxWidth: 520,
    lineHeight: 19,
  },
  carouselArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  carouselArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 20,
  },
  categoryPill: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  categoryPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  categoryPillText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  carouselWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  carouselContent: {
    gap: 16,
    paddingVertical: 4,
  },
  carouselCard: {
    width: 290,
  },
  carouselEmpty: {
    padding: 30,
    alignItems: 'center',
    width: 300,
  },
  carouselEmptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  viewAllBtnWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.full,
  },
  viewAllBtnText: {
    color: '#38BDF8',
    fontSize: 13.5,
    fontWeight: '700',
  },
  whySection: {
    paddingVertical: 44,
    backgroundColor: '#08101E',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderCard,
  },
  sectionHeader: {
    marginBottom: 26,
    alignItems: 'center',
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  whyCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 22,
    width: width < 768 ? '100%' : '23%',
    minWidth: 240,
    flexGrow: 1,
  },
  whyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  whyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  whyCardDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  reviewsSection: {
    paddingVertical: 44,
    backgroundColor: COLORS.bgDark,
  },
  reviewsScroll: {
    gap: 16,
    paddingVertical: 6,
  },
  reviewCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 20,
    width: 300,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  reviewerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.bgCardAlt,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reviewerCity: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  faqSection: {
    paddingVertical: 40,
    backgroundColor: '#091120',
  },
  faqList: {
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
    gap: 10,
  },
  faqCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  faqCardOpen: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: '#0F1A2E',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    paddingRight: 10,
  },
  faqQuestionActive: {
    color: '#38BDF8',
  },
  faqAnswer: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ctaBannerSection: {
    paddingVertical: 40,
    backgroundColor: COLORS.bgDark,
  },
  ctaBanner: {
    backgroundColor: '#0C162A',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.xl,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaBannerTitle: {
    fontSize: width < 768 ? 22 : 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaBannerSubtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 580,
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaBannerBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  ctaPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  ctaPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  ctaWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  ctaWhatsAppBtnText: {
    color: '#34D399',
    fontSize: 13.5,
    fontWeight: '700',
  },
  ownerOpportunitySection: {
    paddingVertical: 36,
    backgroundColor: '#050B14',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderCard,
  },
  ownerOpportunityCard: {
    backgroundColor: '#0C162A',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.xl,
    paddingVertical: 34,
    paddingHorizontal: 28,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
  },
  ownerOppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  ownerOppBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ownerOppTitle: {
    fontSize: width < 768 ? 20 : 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    maxWidth: 720,
    lineHeight: width < 768 ? 26 : 34,
  },
  ownerOppSub: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 640,
    lineHeight: 21,
    marginBottom: 20,
  },
  ownerPerksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 24,
  },
  ownerPerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  ownerPerkText: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '600',
  },
  ownerOppBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  ownerListNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  ownerListNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  adminPortalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  adminPortalLinkText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
