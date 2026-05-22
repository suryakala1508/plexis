import React, { useEffect, useRef, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { HashLink } from 'react-router-hash-link';

const formatPrice = (price) => {
  if (price >= 1000) {
    return `${Math.ceil(price / 1000)}K`;
  }
  return Math.ceil(price).toString();
};

const plans = [
  {
    name: 'Beginner',
    price: '0',
    description: '7 days free trial - perfect for small teams getting started',
    storage: '5GB Storage',
    features: [
      'Lead Management',
      'Project Management',
      'Calendar Management',
      'Dashboard Access',
      'Role-Based Login',
      'Email updates',
    ],
    cta: 'Try for free',
    popular: false,
    gradient: 'from-gray-700 to-gray-900',
    borderColor: 'border-gray-200',
    bgColor: 'bg-white',
    textColor: 'text-gray-900',
    ctaColor: 'bg-gray-900 hover:bg-gray-800 text-white'
  },
  {
    name: 'Pro',
    price: '10000',
    description: 'Ideal for growing businesses needing more power',
    storage: '2TB Storage',
    features: [
      'Everything in Free',
      'AI-Powered Image Search',
      'Advanced Analytics',
      'Priority Support',
      'Custom Branding',
      'Team Collaboration Tools'
    ],
    cta: 'Get started',
    popular: true,
    gradient: 'from-purple-600 to-violet-600',
    borderColor: 'border-purple-300',
    bgColor: 'bg-gradient-to-br from-purple-50 to-white',
    textColor: 'text-gray-900',
    ctaColor: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams with unlimited needs',
    storage: 'Unlimited Storage',
    features: [
      'Everything in Pro',
      'Dedicated Account Manager',
      'Custom Integrations',
      'Advanced Security',
      'SLA Guarantee',
      'White-Label Options',
      '24/7 Premium Support'
    ],
    cta: 'Contact us',
    popular: false,
    gradient: 'from-indigo-600 to-blue-600',
    borderColor: 'border-indigo-200',
    bgColor: 'bg-white',
    textColor: 'text-gray-900',
    ctaColor: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white'
  }
];

const PricingSection = () => {
  const sectionRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currency, setCurrency] = useState({ symbol: '₹', rate: 1, code: 'INR' });
  const [inView, setInView] = useState(false);
  const [cardsVisible, setCardsVisible] = useState({
    title: false,
    beginner: false,
    pro: false,
    enterprise: false,
  });

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const userCountry = data.country_code;
        
        const currencyMap = {
          'IN': { symbol: '₹', rate: 1, code: 'INR' },
          'US': { symbol: '$', rate: 0.012, code: 'USD' },
          'GB': { symbol: '£', rate: 0.0095, code: 'GBP' },
          'DE': { symbol: '€', rate: 0.011, code: 'EUR' },
          'FR': { symbol: '€', rate: 0.011, code: 'EUR' },
          'IT': { symbol: '€', rate: 0.011, code: 'EUR' },
          'ES': { symbol: '€', rate: 0.011, code: 'EUR' },
          'NL': { symbol: '€', rate: 0.011, code: 'EUR' },
          'BE': { symbol: '€', rate: 0.011, code: 'EUR' },
          'AT': { symbol: '€', rate: 0.011, code: 'EUR' },
          'PT': { symbol: '€', rate: 0.011, code: 'EUR' },
          'IE': { symbol: '€', rate: 0.011, code: 'EUR' },
          'FI': { symbol: '€', rate: 0.011, code: 'EUR' },
          'GR': { symbol: '€', rate: 0.011, code: 'EUR' },
        };

        if (currencyMap[userCountry]) {
          setCurrency(currencyMap[userCountry]);
        } else {
          setCurrency({ symbol: '₹', rate: 1, code: 'INR' }); 
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setCurrency({ symbol: '₹', rate: 1, code: 'INR' }); 
      }
    };
    
    fetchCurrency();
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setReducedMotion(true);
      setInView(true);
      setCardsVisible({
        title: true,
        beginner: true,
        pro: true,
        enterprise: true,
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        } else {
          setInView(false);
          setCardsVisible({
            title: false,
            beginner: false,
            pro: false,
            enterprise: false,
          });
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!inView || reducedMotion) return;

    const timeouts = [];

    timeouts.push(
      setTimeout(() => {
        setCardsVisible((prev) => ({ ...prev, title: true }));
      }, 100)
    );

    timeouts.push(
      setTimeout(() => {
        setCardsVisible((prev) => ({ ...prev, beginner: true }));
      }, 200)
    );

    timeouts.push(
      setTimeout(() => {
        setCardsVisible((prev) => ({ ...prev, pro: true }));
      }, 350)
    );

    timeouts.push(
      setTimeout(() => {
        setCardsVisible((prev) => ({ ...prev, enterprise: true }));
      }, 500)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [inView, reducedMotion]);

  const getCardStyles = (planName) => {
    const visible = cardsVisible[planName.toLowerCase()];
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: reducedMotion
        ? 'none'
        : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out'
    };
  };

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div
          className="text-center mb-16"
          style={{
            opacity: cardsVisible.title ? 1 : 0,
            transform: cardsVisible.title ? 'translateY(0)' : 'translateY(30px)',
            transition: reducedMotion
              ? 'none'
              : 'transform 0.6s ease-out, opacity 0.6s ease-out'
          }}
        >
          <h2
            className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent"
            style={{ fontFamily: "'Poppins', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            Affordable Plans That Scale
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Pick the plan that fits your workflow—every tier includes the tools you need to run your studio smoothly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={getCardStyles(plan.name)}
              className={`relative rounded-2xl border-2 ${plan.borderColor} ${plan.bgColor} p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${plan.gradient} text-white shadow-md`}>
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${plan.textColor}`}>
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {plan.description}
                </p>
                <div className="mb-2">
                  {plan.price === 'Custom' ? (
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl font-semibold text-gray-600">{currency.symbol}</span>
                      <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mx-1">
                        {formatPrice(parseFloat(plan.price) * currency.rate)}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-purple-600">
                  {plan.storage}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.name === 'Enterprise') {
                    window.location.href = '/our-story#our-contact';
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className={`w-full py-3 px-6 rounded-lg font-semibold ${plan.ctaColor} transition-all duration-300 flex items-center justify-center group shadow-md hover:shadow-lg`}
              >
                {plan.cta}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        <div
          className="text-center mt-16"
          style={{
            opacity: cardsVisible.enterprise ? 1 : 0,
            transform: cardsVisible.enterprise ? 'translateY(0)' : 'translateY(20px)',
            transition: reducedMotion
              ? 'none'
              : 'transform 0.6s ease-out 0.6s, opacity 0.6s ease-out 0.6s'
          }}
        >
          <p className="text-gray-600 mb-4">
            Need a custom solution? Our team is here to help.
          </p>
          <HashLink
            smooth
            to="/our-story#our-contact"
            className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            Talk to our sales team
            <ArrowRight className="ml-2 w-4 h-4" />
          </HashLink>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;