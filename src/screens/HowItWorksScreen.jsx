import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  FileText,
  ShieldCheck,
  Clock,
  Fuel,
  Plus,
  Minus,
  Bike,
  ArrowRight,
} from 'lucide-react-native';
import { FAQS_DATA } from '../data/bikes';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

const HINDI_FAQS = [
  {
    question: 'मैं बाइक कैसे किराए पर ले सकता हूँ?',
    answer: 'किराए पर लेना बहुत आसान है! हमारी फ्लीट ब्राउज़ करें, बाइक चुनें, किराये की तारीखें तय करें और विवरण सबमिट करें। आप व्हाट्सएप या ऑनलाइन तुरंत पुष्टि कर सकते हैं।',
  },
  {
    question: 'किन दस्तावेज़ों की आवश्यकता है?',
    answer: 'आपको चाहिए: 1) मूल वैध ड्राइविंग लाइसेंस (दोपहिया वाहन हेतु), 2) सरकार द्वारा जारी पहचान पत्र (आधार, पासपोर्ट या वोटर आईडी), और 3) पासपोर्ट आकार का फ़ोटो या तत्काल सेल्फी सत्यापन।',
  },
  {
    question: 'क्या ड्राइविंग लाइसेंस अनिवार्य है?',
    answer: 'हाँ, कानून के अनुसार वैध दोपहिया ड्राइविंग लाइसेंस होना अनिवार्य है। लर्नर लाइसेंस या एक्सपायर हो चुके लाइसेंस स्वीकार नहीं किए जाते हैं।',
  },
  {
    question: 'क्या सिक्योरिटी डिपॉजिट आवश्यक है?',
    answer: 'हाँ, पिकअप के समय ₹1,500 से ₹5,000 (बाइक श्रेणी के अनुसार) की पूर्णतः वापसी योग्य सुरक्षा जमा राशि ली जाती है, जो वाहन वापसी निरीक्षण के 24-48 घंटों के भीतर 100% वापस कर दी जाती है।',
  },
  {
    question: 'क्या रेंटल के साथ हेलमेट दिया जाता है?',
    answer: 'हाँ! हर रेंटल के साथ एक स्वच्छ, प्रमाणित ISI/DOT हेलमेट निःशुल्क दिया जाता है। पीछे बैठने वाले साथी के लिए ₹50/दिन के मामूली शुल्क पर अतिरिक्त हेलमेट उपलब्ध है।',
  },
  {
    question: 'आपकी ईंधन (फ्यूल) नीति क्या है?',
    answer: 'हम \'समान-से-समान\' (Same-to-Same) ईंधन नीति का पालन करते हैं। पिकअप के समय जितना ईंधन था, वापसी के समय उतना ही ईंधन होना चाहिए।',
  },
];

export default function HowItWorksScreen({ navigation }) {
  const { t, isHindi } = useLanguage();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const steps = [
    {
      num: t('guide.step1Num', '01'),
      title: t('guide.step1Title', 'Explore Our Fleet'),
      desc: t('guide.step1Desc', 'Browse our diverse lineup of scooters, daily commuters, highway cruisers, and track-ready superbikes.'),
    },
    {
      num: t('guide.step2Num', '02'),
      title: t('guide.step2Title', 'Select Your Machine'),
      desc: t('guide.step2Desc', 'Review detailed factory specifications, real photographs, verified rider reviews, and transparent daily rates.'),
    },
    {
      num: t('guide.step3Num', '03'),
      title: t('guide.step3Title', 'Choose Dates & Enquire'),
      desc: t('guide.step3Desc', 'Enquire directly via WhatsApp or book online. Select your preferred pickup dates, time, and hub location.'),
    },
    {
      num: t('guide.step4Num', '04'),
      title: t('guide.step4Title', 'Confirm & Ride'),
      desc: t('guide.step4Desc', 'Present your driving licence and ID at our pickup hub, perform a 2-minute vehicle inspection, and hit the open road!'),
    },
  ];

  const currentFaqs = isHindi ? HINDI_FAQS : FAQS_DATA;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.pretitle}>{t('guide.pretitle', 'HOW RENTAL WORKS')}</Text>
          <Text style={styles.title}>{t('guide.title', 'Simple 4-Step Process')}</Text>
          <Text style={styles.subtitle}>
            {t('guide.subtitle', 'From booking your machine to returning it after your road trip, we make motorcycle rental completely effortless, transparent, and safe.')}
          </Text>
        </View>

        {/* Steps Grid (2x2 on Desktop / 1-col on Mobile) */}
        <View style={styles.stepsGrid}>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>{s.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
              </View>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>

        {/* Essential Guidelines Card */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesPretitle}>{t('guide.guidelinesPretitle', 'ESSENTIAL GUIDELINES')}</Text>
          <Text style={styles.guidelinesTitle}>{t('guide.guidelinesTitle', 'What You Need to Know')}</Text>

          <View style={styles.guidelinesGrid}>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineIconCircle}>
                <FileText size={20} color={COLORS.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guidelineHeading}>{t('guide.docsTitle', 'Required Documents')}</Text>
                <Text style={styles.guidelineText}>
                  {t('guide.docsDesc', 'Valid original Driving License (A-category for motorcycles), Aadhaar Card or Passport, and 2 passport photos.')}
                </Text>
              </View>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineIconCircle}>
                <ShieldCheck size={20} color={COLORS.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guidelineHeading}>{t('guide.depositTitle', 'Security Deposit')}</Text>
                <Text style={styles.guidelineText}>
                  {t('guide.depositDesc', 'A 100% refundable security deposit is held during the ride and credited back within 24-48 hours post return inspection.')}
                </Text>
              </View>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineIconCircle}>
                <Clock size={20} color={COLORS.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guidelineHeading}>{t('guide.clockTitle', '24-Hour Rental Clock')}</Text>
                <Text style={styles.guidelineText}>
                  {t('guide.clockDesc', 'Rentals operate on a strict 24-hour cycle. Picking up at 10:00 AM means return by 10:00 AM the next day.')}
                </Text>
              </View>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineIconCircle}>
                <Fuel size={20} color={COLORS.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guidelineHeading}>{t('guide.fuelTitle', 'Fuel Policy')}</Text>
                <Text style={styles.guidelineText}>
                  {t('guide.fuelDesc', 'Vehicle is provided with sufficient reserve fuel and must be returned at the same or higher fuel level.')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={styles.faqPretitle}>{t('guide.faqPretitle', 'FREQUENT QUESTIONS')}</Text>
          <Text style={styles.faqTitle}>{t('guide.faqTitle', 'Rental FAQs')}</Text>

          <View style={styles.faqList}>
            {currentFaqs.map((faq, index) => {
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

        {/* CTA Button */}
        <View style={styles.ctaBtnWrapper}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation?.navigate('Motorbikes')}
            activeOpacity={0.8}
          >
            <Bike size={18} color="#FFFFFF" />
            <Text style={styles.ctaBtnText}>{t('guide.browseFleet', 'Browse Available Fleet')}</Text>
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
    color: COLORS.textPrimary,
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
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 36,
  },
  stepCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 22,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  stepNumCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  stepDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  guidelinesCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 24,
    marginBottom: 36,
  },
  guidelinesPretitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  guidelinesTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  guidelinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  guidelineItem: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  guidelineIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guidelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  guidelineText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  faqSection: {
    marginBottom: 36,
  },
  faqPretitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  faqTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
  },
  faqCardOpen: {
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  faqQuestionActive: {
    color: '#38BDF8',
  },
  faqAnswer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
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
