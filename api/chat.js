// ============================================================
//  ملف: api/chat.js (نسخة مبسطة بنموذج واحد)
// ============================================================

module.exports = async (req, res) => {
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
        
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
        const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
        
        // ✅ استخدم نموذجاً واحداً فقط
        const model = 'mistralai/mistral-7b-instruct:free';
        console.log(`🤖 جرب النموذج: ${model}`);
        
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
                        content: 'أنت مساعد دعم فني لشركة TecnoShark. أجب بالعربية بشكل مختصر ومفيد. إذا سألك عن موقع، أعطه رابط الموقع. إذا سألك عن سعر، أحله للتواصل مع الدعم.'
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
        
        // ✅ قراءة الاستجابة كنص أولاً
        const responseText = await response.text();
        console.log('📥 استجابة OpenRouter:', response.status, responseText.substring(0, 300));
        
        if (!response.ok) {
            // ✅ محاولة فهم الخطأ
            let errorMessage = responseText;
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.error?.message || errorJson.message || responseText;
            } catch (e) {
                // النص ليس JSON
            }
            
            return res.status(response.status).json({
                success: false,
                error: `فشل الاتصال بـ OpenRouter: ${errorMessage}`,
                status: response.status
            });
        }
        
        const data = JSON.parse(responseText);
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
