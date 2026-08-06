// ============================================================
//  ملف: api/chat.js
//  دالة Vercel Serverless للاتصال بـ OpenRouter API
// ============================================================

module.exports = async (req, res) => {
    // ✅ إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // ✅ التعامل مع طلب OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // ✅ التأكد من أن الطلب هو POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Missing question' });
        }
        
        // ✅ مفتاح OpenRouter (من متغيرات البيئة أو مباشر)
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
        const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
        
        console.log('📡 جاري الاتصال بـ OpenRouter API...');
        
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://tecno-shark.vercel.app',
                'X-Title': 'TecnoShark Bot'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
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
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ خطأ من OpenRouter:', response.status, errorData);
            return res.status(response.status).json({
                success: false,
                error: `فشل الاتصال بـ OpenRouter (${response.status})`,
                details: errorData
            });
        }
        
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || 'لم أستطع توليد إجابة.';
        
        console.log('✅ تم الحصول على إجابة بنجاح');
        return res.status(200).json({
            success: true,
            answer: answer
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
