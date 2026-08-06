// ============================================================
//  ملف: api/chat.js
//  دالة Vercel Serverless للاتصال بـ OpenRouter API
// ============================================================

// ✅ مفتاح OpenRouter API (يُفضل وضعه في متغيرات البيئة)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ✅ النماذج المجانية المتاحة
const FREE_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'deepseek/deepseek-chat:free'
];

// ✅ دالة Vercel الرئيسية
module.exports = async (req, res) => {
    // ✅ السماح بـ CORS (للاستقبال من أي مكان)
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
        // ✅ استخراج السؤال من الطلب
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Missing question' });
        }
        
        console.log('📡 جاري الاتصال بـ OpenRouter API...');
        console.log('❓ السؤال:', question);
        
        // ✅ محاولة الاتصال بـ OpenRouter مع كل نموذج حتى النجاح
        let lastError = null;
        
        for (const model of FREE_MODELS) {
            try {
                console.log(`🔄 جرب النموذج: ${model}`);
                
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
                                content: `أنت مساعد دعم فني لشركة TecnoShark. أجب على أسئلة العملاء بشكل مفيد ومختصر. استخدم اللغة العربية دائماً. 
                                
                                معلومات عن المواقع:
                                - Imtihan (الامتحانات الإلكترونية): https://imtihan-eight.vercel.app/
                                - نبض (الملابس والهوديز): https://nabd-ten.vercel.app/
                                - Scout DoJo (الكشافة البحرية): https://kayan-cyan.vercel.app/
                                - TS مقاولات (مواد البناء): https://ts-construction-final.vercel.app/
                                - TS POS (نقاط البيع): https://ts-pos-final.vercel.app/
                                - TS Attend Pro (الحضور والغياب): https://ts-attend-pro.vercel.app/
                                
                                للتواصل: 01144100018 - 01126125881`
                            },
                            {
                                role: 'user',
                                content: question
                            }
                        ],
                        max_tokens: 500,
                        temperature: 0.7
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const answer = data.choices?.[0]?.message?.content || 'لم أستطع توليد إجابة.';
                    
                    console.log(`✅ نجح النموذج: ${model}`);
                    
                    return res.status(200).json({
                        success: true,
                        answer: answer,
                        model: model
                    });
                } else {
                    // ✅ حفظ الخطأ للمحاولة التالية
                    const errorData = await response.json();
                    lastError = errorData;
                    console.warn(`⚠️ فشل النموذج ${model}:`, errorData);
                }
            } catch (error) {
                lastError = error.message;
                console.warn(`⚠️ خطأ في النموذج ${model}:`, error.message);
            }
        }
        
        // ✅ إذا فشلت جميع النماذج
        console.error('❌ جميع النماذج فشلت');
        return res.status(500).json({
            success: false,
            error: 'All models failed',
            details: lastError
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
