import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// Optimized FAQ component with better performance
export default function FaqSection() {

  // Memoized FAQ data to prevent recreation on every render
const faqData = useMemo(() => [
  {
    id: 1,
    question: "Is Plexis suitable for beginners or only professionals?",
    answer:
      "Yes Plexis is built for all skill levels. Beginners get guided workflows, while professionals get powerful automation and advanced controls.",
  },
  {
    id: 2,
    question: "How many photos or events can I store on Plexis?",
    answer:
      "You can upload unlimited photos and manage unlimited events based on your plan. Plexis is built to scale with your growing studio.",
  },
  {
    id: 3,
    question: "Can clients purchase prints or download photos directly?",
    answer:
      "Absolutely clients can order prints, buy digital downloads, and choose packages right from their gallery, creating a seamless revenue stream.",
  },
  {
    id: 4,
    question: "Does Plexis support team collaboration?",
    answer:
      "Yes, you can add team members, assign roles, and manage permissions. Perfect for studios with multiple photographers or editors.",
  },
  {
    id: 5,
    question: "How quickly are galleries delivered to clients?",
    answer:
      "With AI culling and smart upload optimization, you can deliver polished galleries in hours not days speeding up your entire workflow.",
  },
  {
    id: 6,
    question: "Can I use Plexis on mobile or tablet while shooting?",
    answer:
      "Definitely Plexis works smoothly on phones and tablets, so you can manage events, upload previews, or track client updates on the go.",
  },
], []);
  

  // State to manage which FAQ item is currently expanded
  const [expandedId, setExpandedId] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px -100px 0px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Optimized toggle function with useCallback to prevent recreation
  const handleToggle = useCallback((id) => {
    setExpandedId(prevId => prevId === id ? null : id);
  }, []);

  // Memoized styles to prevent recalculation
  const containerStyles = useMemo(() => ({
    main: `pt-0 pb-12 md:pb-0 px-4 font-sans transition-colors duration-500`,
    background: 'bg-white',
    title: `title-font text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold text-center bg-clip-text text-transparent tracking-tight leading-tight mb-2`,
    titleGradient: 'bg-gradient-to-r from-purple-600 to-violet-600',
    subtitle: `text-base md:text-xl font-autoquotation should be semibold text-gray-600`
  }), []);

  // Memoized FAQ item styles
  const getItemStyles = useCallback((index) => ({
    container: `rounded-xl border transition-all duration-300 overflow-hidden faq-item-animated border-purple-200 bg-white shadow-sm hover:shadow-md`,
    question: `text-base sm:text-lg font-medium text-gray-900`,
    icon: `text-2xl font-light transition-transform duration-300 ease-in-out transform text-gray-500`,
    answer: `text-base leading-relaxed text-gray-600`
  }), []);

  // Memoized FAQ Item Component for better performance
  const FaqItem = useMemo(() => {
    return ({ item, index, isExpanded, onToggle, styles }) => {
      const answerRef = useRef(null);
      
      return (
        <div
          className={styles.container}
          style={{
            animationDelay: `${index * 0.1}s`,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            opacity: isVisible ? 1 : 0,
            transition: `all 0.6s ease-out ${index * 0.1}s`,
            willChange: 'transform, opacity'
          }}
        >
          {/* Question container */}
          <button
            onClick={() => onToggle(item.id)}
            className="w-full text-left p-8 sm:py-6 flex justify-between items-center cursor-pointer focus:outline-none hover:bg-opacity-50 transition-colors duration-200"
            style={{ willChange: 'background-color' }}
          >
            <span className={styles.question}>{item.question}</span>
            {/* Optimized icon with transform */}
            <span 
              className={styles.icon}
              style={{
                transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                willChange: 'transform'
              }}
            >
              +
            </span>
          </button>

          {/* Answer section with optimized animations */}
          <div
            ref={answerRef}
            className="transition-all duration-500 ease-in-out overflow-hidden"
            style={{
              maxHeight: isExpanded ? '400px' : '0px',
              opacity: isExpanded ? 1 : 0,
              transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
              willChange: 'max-height, opacity, transform'
            }}
          >
            <div className="p-4 sm:py-6 pt-0">
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        </div>
      );
    };
  }, [isVisible]);

  return (
    <div 
      ref={containerRef}
      className={`${containerStyles.main} ${containerStyles.background}`}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap');

          .title-font {
            font-family: 'Poppins', sans-serif;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes liftAndShadow {
            from {
              transform: translateY(0) scale(1);
              box-shadow: 0 4px 6px rgba(139, 92, 246, 0.1);
            }
            to {
              transform: translateY(-5px) scale(1.02);
              box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2);
            }
          }
          
          @keyframes slideDownFadeIn {
            from {
                opacity: 0;
                max-height: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                max-height: 500px;
                transform: translateY(0);
            }
          }

          .faq-item-animated {
            position: relative;
            z-index: 1;
            will-change: transform, box-shadow;
          }

          .faq-item-animated:hover {
            animation: liftAndShadow 0.3s forwards;
            z-index: 2;
          }
          
          .answer-animation {
            animation: slideDownFadeIn 0.5s ease-out forwards;
          }

          /* GPU acceleration for better performance */
          .faq-item-animated,
          .faq-item-animated * {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
        `}
      </style>
      
      <div className="w-full max-w-4xl mx-auto py-0 md:py-0 px-4 sm:px-6 lg:px-8">
        
        <div 
          className="text-center mb-6"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(-30px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s ease-out 0.2s'
          }}
        >
          <h1 className={`${containerStyles.title} ${containerStyles.titleGradient}`}>
            Got questions?
          </h1>
          <h2 className={containerStyles.subtitle}>
            We've got answers
          </h2>
        </div>

        <div className="space-y-0">
          {faqData.map((item, index) => {
            const styles = getItemStyles(index);
            const isExpanded = expandedId === item.id;
            
            return (
              <FaqItem
                key={item.id}
                item={item}
                index={index}
                isExpanded={isExpanded}
                onToggle={handleToggle}
                styles={styles}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}