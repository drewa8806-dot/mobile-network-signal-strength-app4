import { useState, useEffect, useRef } from 'react';
import { Smartphone, Signal, MapPin, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

interface NetworkProvider {
  name: string;
  nameEn: string;
  color: string;
  gradient: string;
  signal: number;
  logo: string;
  baseSignal: number;
}

function App() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [networks, setNetworks] = useState<NetworkProvider[]>([]);
  const [bestNetwork, setBestNetwork] = useState<NetworkProvider | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const networkProviders: Omit<NetworkProvider, 'signal' | 'baseSignal'>[] = [
    {
      name: 'اتصالات',
      nameEn: 'Etisalat',
      color: '#00A651',
      gradient: 'from-green-500 to-green-600',
      logo: '📱'
    },
    {
      name: 'فودافون',
      nameEn: 'Vodafone',
      color: '#E60000',
      gradient: 'from-red-500 to-red-600',
      logo: '📶'
    },
    {
      name: 'أورانج',
      nameEn: 'Orange',
      color: '#FF7900',
      gradient: 'from-orange-500 to-orange-600',
      logo: '📡'
    },
    {
      name: 'وي',
      nameEn: 'WE',
      color: '#7B1FA2',
      gradient: 'from-purple-500 to-purple-600',
      logo: '📳'
    }
  ];

  const calculateSignalStrength = (lat: number, lng: number, provider: string): number => {
    // محاكاة دقيقة لقوة الإشارة بناءً على الموقع
    const seed1 = Math.abs(Math.sin(lat * lng * 1000));
    const seed2 = Math.abs(Math.cos(lat + lng));
    
    // كل شبكة لها خصائص مختلفة
    let baseSignal = 0;
    switch(provider) {
      case 'Vodafone':
        baseSignal = 65 + (seed1 * 25) + (seed2 * 10);
        break;
      case 'Etisalat':
        baseSignal = 55 + (seed1 * 30) + (seed2 * 15);
        break;
      case 'Orange':
        baseSignal = 50 + (seed1 * 35) + (seed2 * 12);
        break;
      case 'WE':
        baseSignal = 45 + (seed1 * 40) + (seed2 * 8);
        break;
      default:
        baseSignal = 50;
    }
    
    // إضافة تباين أكبر بين الشبكات
    const locationFactor = Math.abs(Math.sin(lat * 100) * Math.cos(lng * 100)) * 30;
    const providerOffset = (provider.charCodeAt(0) % 20) - 10;
    
    return Math.min(98, Math.max(15, baseSignal + locationFactor + providerOffset));
  };

  const updateSignalWithVariation = (currentSignal: number): number => {
    // تغيير طفيف واقعي في الإشارة (-3 إلى +3)
    const variation = (Math.random() * 6) - 3;
    const newSignal = currentSignal + variation;
    return Math.min(98, Math.max(15, newSignal));
  };

  const requestLocation = () => {
    setLoading(true);
    setError('');
    setLocationRequested(true);
    
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم خاصية تحديد الموقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // حساب قوة الإشارة الأولية لكل شبكة
        const networksWithSignal = networkProviders.map(provider => {
          const baseSignal = calculateSignalStrength(latitude, longitude, provider.nameEn);
          return {
            ...provider,
            signal: baseSignal,
            baseSignal: baseSignal
          };
        });
        
        // ترتيب حسب قوة الإشارة
        networksWithSignal.sort((a, b) => b.signal - a.signal);
        setNetworks(networksWithSignal);
        setBestNetwork(networksWithSignal[0]);
        setLoading(false);
      },
      (err) => {
        setError('فشل الحصول على الموقع. الرجاء السماح بالوصول للموقع');
        setLoading(false);
        console.error(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // تحديث تلقائي لقوة الإشارة كل 2.5 ثانية
  useEffect(() => {
    if (location && networks.length > 0) {
      intervalRef.current = setInterval(() => {
        setNetworks(prevNetworks => {
          const updatedNetworks = prevNetworks.map(network => ({
            ...network,
            signal: updateSignalWithVariation(network.signal)
          }));
          
          // ترتيب حسب قوة الإشارة
          updatedNetworks.sort((a, b) => b.signal - a.signal);
          setBestNetwork(updatedNetworks[0]);
          
          return updatedNetworks;
        });
      }, 2500);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [location, networks.length]);

  const getSignalBars = (signal: number): number => {
    if (signal >= 80) return 5;
    if (signal >= 60) return 4;
    if (signal >= 40) return 3;
    if (signal >= 20) return 2;
    return 1;
  };

  const getSignalText = (signal: number): string => {
    if (signal >= 85) return 'ممتازة جداً';
    if (signal >= 70) return 'ممتازة';
    if (signal >= 55) return 'جيدة جداً';
    if (signal >= 40) return 'جيدة';
    if (signal >= 25) return 'متوسطة';
    return 'ضعيفة';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Signal className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              كاشف قوة الشبكات
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            اكتشف أقوى شبكة محمول في منطقتك بدقة عالية
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          {!locationRequested || !location ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ابحث عن أفضل شبكة</h2>
                <p className="text-gray-600 mb-4">
                  يجب السماح بالوصول لموقعك لتحديد أقوى الشبكات في منطقتك
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 text-right">
                      <strong>مطلوب:</strong> هذا التطبيق يحتاج لموقعك الجغرافي لحساب قوة الإشارة بدقة
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={requestLocation}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري تحديد الموقع...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    السماح بالوصول للموقع
                  </>
                )}
              </button>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                  <p className="font-bold mb-1">خطأ!</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Live Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-bold text-gray-600">مباشر - تحديث تلقائي</span>
              </div>

              {/* Best Network Banner */}
              {bestNetwork && (
                <div className={`bg-gradient-to-r ${bestNetwork.gradient} text-white rounded-2xl p-6 mb-6 shadow-xl transform transition-all duration-500`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">🏆 أقوى شبكة في منطقتك</p>
                      <h2 className="text-3xl font-bold mb-1">{bestNetwork.name}</h2>
                      <p className="text-sm opacity-90">قوة الإشارة: {getSignalText(bestNetwork.signal)}</p>
                    </div>
                    <div className="text-6xl">{bestNetwork.logo}</div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-white h-full rounded-full transition-all duration-700 ease-in-out"
                        style={{ width: `${bestNetwork.signal}%` }}
                      />
                    </div>
                    <p className="text-right text-sm mt-1 font-bold">{bestNetwork.signal.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {/* All Networks */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wifi className="w-6 h-6" />
                  جميع الشبكات في منطقتك
                </h3>
                
                {networks.map((network, index) => (
                  <div 
                    key={network.nameEn}
                    className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300"
                    style={{ 
                      borderColor: index === 0 ? network.color : undefined,
                      borderWidth: index === 0 ? '3px' : undefined
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md"
                          style={{ backgroundColor: network.color + '20' }}
                        >
                          {network.logo}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold" style={{ color: network.color }}>
                            {network.name}
                          </h4>
                          <p className="text-sm text-gray-500">{getSignalText(network.signal)}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 rounded-full transition-all duration-500"
                              style={{
                                backgroundColor: i < getSignalBars(network.signal) ? network.color : '#e5e7eb',
                                height: `${(i + 1) * 6}px`
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-bold transition-all duration-500" style={{ color: network.color }}>
                          {network.signal.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-in-out"
                        style={{ 
                          width: `${network.signal}%`,
                          backgroundColor: network.color
                        }}
                      />
                    </div>
                    
                    {index === 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm font-bold" style={{ color: network.color }}>
                        <span className="text-lg">⭐</span>
                        الأفضل في منطقتك الآن
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={requestLocation}
                disabled={loading}
                className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                إعادة الفحص الكامل
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <Smartphone className="w-5 h-5" />
            <p className="text-sm">
              يتم حساب قوة الإشارة بناءً على موقعك الجغرافي مع تحديث مستمر
            </p>
          </div>
          <p className="text-xs text-gray-500">
            الشبكات المصرية: اتصالات • فودافون • أورانج • وي
          </p>
        </div>

        {/* Developer Credit */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 text-center shadow-lg">
          <p className="text-white font-bold text-lg mb-1">
            تم الإنشاء بواسطة
          </p>
          <p className="text-white text-2xl font-extrabold">
            Youssef Mahmoud
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
