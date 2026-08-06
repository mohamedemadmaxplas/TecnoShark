// ============================================================
//  ملف: api/chat.js (نسخة مبسطة للتجربة)
// ============================================================

// ✅ استخدم متغير البيئة أو المفتاح مباشرة
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

module.exports = async (req, res) => {
    // ✅ إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Missing question' });
        }
        
        console.log('📡 جاري الاتصال بـ OpenRouter API...');
        console.log('❓ السؤال:', question);
        console.log('🔑 المفتاح:', OPENROUTER_API_KEY ? 'موجود ✅' : 'غير موجود ❌');
        
        // ✅ استخدام نموذج واحد فقط للتجربة
        const model = 'google/gemini-2.0-flash-exp:free';
        console.log(`🤖 النموذج: ${model}`);
        
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://tecno-shark.vercel.app',
                'X-Title': 'TecnoShark Bot'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'أنت مساعد دعم فني. أجب بالعربية بشكل مختصر ومفيد.'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        // ✅ قراءة الاستجابة كـ text أولاً لتشخيص المشكلة
        const responseText = await response.text();
        console.log('📥 استجابة OpenRouter:', response.status, responseText.substring(0, 200));
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText || 'Unknown error' };
            }
            
            console.error('❌ خطأ من OpenRouter:', errorData);
            
            // ✅ رسائل خطأ مفهومة
            if (response.status === 401) {
                return res.status(401).json({
                    success: false,
                    error: 'مفتاح API غير صحيح. تأكد من المفتاح في متغيرات البيئة.',
                    details: errorData
                });
            }
            
            if (response.status === 402 || response.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'تم تجاوز حد الاستخدام المجاني. حاول لاحقاً.',
                    details: errorData
                });
            }
            
            return res.status(response.status).json({
                success: false,
                error: `فشل الاتصال بـ OpenRouter (${response.status})`,
                details: errorData
            });
        }
        
        const data = JSON.parse(responseText);
        const answer = data.choices?.[0]?.message?.content || 'لم أستطع توليد إجابة.';
        
        console.log('✅ تم الحصول على إجابة بنجاح');
        return res.status(200).json({
            success: true,
            answer: answer,
            model: model
        });
        
    } catch (error) {
        console.error('❌ خطأ في الخادم:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            details: error.message
        });
    }
};
