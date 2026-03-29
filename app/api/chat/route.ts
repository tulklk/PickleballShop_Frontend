import { NextRequest, NextResponse } from "next/server";
import { DEBUG_API } from "@/lib/utils/debugApi";

// System prompt với context về pickleball products
const SYSTEM_PROMPT = `Bạn là trợ lý AI chuyên tư vấn về sản phẩm Pickleball cho cửa hàng IKA PickleBall Shop. 
Nhiệm vụ của bạn là trả lời các câu hỏi của khách hàng về:

1. **Vợt Pickleball (Paddles):**
   - Các thương hiệu: Selkirk, Paddletek, Onix, Franklin, và các thương hiệu khác
   - Các loại vợt: Control, Power, All-around
   - Vật liệu: Graphite, Carbon Fiber, Fiberglass, Polymer Core
   - Kích thước và trọng lượng
   - Tư vấn chọn vợt theo trình độ: Người mới, Trung cấp, Nâng cao

2. **Bóng Pickleball:**
   - Bóng outdoor và indoor
   - Các thương hiệu: Onix, Franklin, Dura
   - Số lỗ và thiết kế

3. **Phụ kiện:**
   - Túi đựng vợt
   - Giày chơi pickleball
   - Quần áo thể thao
   - Lưới và thiết bị sân chơi

4. **Dịch vụ:**
   - Giao hàng nhanh nội thành trong 24h
   - Chính hãng 100%, hợp tác với IKA Sport
   - Hỗ trợ tư vấn chọn sản phẩm phù hợp

Hãy trả lời một cách thân thiện, chuyên nghiệp, và hữu ích. Nếu không chắc chắn về thông tin cụ thể, hãy đề xuất khách hàng xem chi tiết sản phẩm trên website hoặc liên hệ bộ phận hỗ trợ.

Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Kiểm tra xem có OpenAI API key không
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      // Fallback: Trả lời đơn giản dựa trên keywords
      const userMessage = messages[messages.length - 1]?.content || "";
      const response = generateFallbackResponse(userMessage);
      return NextResponse.json({ message: response });
    }

    // Sử dụng OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (DEBUG_API) {
        console.error("OpenAI API error:", errorData);
      }
      
      // Fallback nếu API lỗi
      const userMessage = messages[messages.length - 1]?.content || "";
      const fallbackResponse = generateFallbackResponse(userMessage);
      return NextResponse.json({ message: fallbackResponse });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Xin lỗi, tôi không thể trả lời câu hỏi này.";

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    if (DEBUG_API) {
      console.error("Chat API error:", error);
    }
    
    // Fallback response
    const body = await request.json().catch(() => ({}));
    const messages = body.messages || [];
    const userMessage = messages[messages.length - 1]?.content || "";
    const fallbackResponse = generateFallbackResponse(userMessage);
    
    return NextResponse.json({ message: fallbackResponse });
  }
}

// Fallback response generator khi không có OpenAI API key hoặc API lỗi
function generateFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Câu chào hỏi
  if (lowerMessage.includes("xin chào") || lowerMessage.includes("hello") || lowerMessage.includes("chào")) {
    return "Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm Pickleball?";
  }

  // Câu hỏi về vợt
  if (lowerMessage.includes("vợt") || lowerMessage.includes("paddle")) {
    if (lowerMessage.includes("chọn") || lowerMessage.includes("nên mua") || lowerMessage.includes("tư vấn")) {
      return "Để chọn vợt phù hợp, bạn cần xem xét:\n\n1. **Trình độ:** Người mới nên chọn vợt All-around, người chơi nâng cao có thể chọn Control hoặc Power.\n\n2. **Vật liệu:** Graphite nhẹ và linh hoạt, Carbon Fiber cứng và mạnh mẽ.\n\n3. **Thương hiệu:** Selkirk, Paddletek, Onix là các thương hiệu phổ biến.\n\nBạn có thể xem chi tiết các sản phẩm vợt trên trang Products của chúng tôi!";
    }
    if (lowerMessage.includes("giá") || lowerMessage.includes("bao nhiêu")) {
      return "Giá vợt Pickleball tại cửa hàng chúng tôi dao động từ 2.000.000₫ đến 8.000.000₫ tùy theo thương hiệu và loại vợt. Bạn có thể xem giá chi tiết từng sản phẩm trên website!";
    }
    return "Chúng tôi có nhiều loại vợt Pickleball từ các thương hiệu nổi tiếng như Selkirk, Paddletek, Onix. Bạn muốn tìm hiểu về loại vợt nào cụ thể?";
  }

  // Câu hỏi về bóng
  if (lowerMessage.includes("bóng") || lowerMessage.includes("ball")) {
    if (lowerMessage.includes("outdoor") || lowerMessage.includes("ngoài trời")) {
      return "Bóng Pickleball outdoor thường có nhiều lỗ hơn (40 lỗ) và cứng hơn để chịu được gió. Thương hiệu Onix Fuse G2 là lựa chọn phổ biến cho outdoor.";
    }
    if (lowerMessage.includes("indoor") || lowerMessage.includes("trong nhà")) {
      return "Bóng Pickleball indoor thường có ít lỗ hơn (26 lỗ) và mềm hơn. Phù hợp cho sân trong nhà.";
    }
    return "Chúng tôi có bóng Pickleball cho cả outdoor và indoor từ các thương hiệu Onix, Franklin. Bạn muốn tìm hiểu về loại nào?";
  }

  // Câu hỏi về phụ kiện
  if (lowerMessage.includes("túi") || lowerMessage.includes("bag")) {
    return "Chúng tôi có nhiều loại túi đựng vợt từ túi đơn giản đến túi deluxe có nhiều ngăn. Giá từ 500.000₫ đến 1.500.000₫.";
  }
  if (lowerMessage.includes("giày") || lowerMessage.includes("shoes")) {
    return "Giày chơi Pickleball cần có đế không trơn, hỗ trợ tốt cho cổ chân. Chúng tôi có nhiều mẫu giày phù hợp cho sân cứng và sân cỏ nhân tạo.";
  }

  // Câu hỏi về giao hàng
  if (lowerMessage.includes("giao hàng") || lowerMessage.includes("ship") || lowerMessage.includes("vận chuyển")) {
    return "Chúng tôi giao hàng nhanh nội thành trong 24h. Phí vận chuyển tùy theo địa chỉ. Bạn có thể xem chi tiết khi thanh toán!";
  }

  // Câu hỏi về giá
  if (lowerMessage.includes("giá") || lowerMessage.includes("price") || lowerMessage.includes("bao nhiêu")) {
    return "Giá sản phẩm Pickleball tại cửa hàng chúng tôi rất đa dạng:\n\n- Vợt: từ 2.000.000₫ đến 8.000.000₫\n- Bóng: từ 200.000₫ đến 500.000₫\n- Phụ kiện: từ 300.000₫ đến 2.000.000₫\n\nBạn có thể xem giá chi tiết từng sản phẩm trên website!";
  }

  // Câu hỏi về thương hiệu
  if (lowerMessage.includes("thương hiệu") || lowerMessage.includes("brand") || lowerMessage.includes("hãng")) {
    return "Chúng tôi cung cấp các thương hiệu Pickleball uy tín:\n\n- **Selkirk:** Vợt cao cấp, phổ biến cho người chơi chuyên nghiệp\n- **Paddletek:** Vợt chất lượng tốt, giá hợp lý\n- **Onix:** Vợt và bóng phổ biến\n- **Franklin:** Thương hiệu lớn, đa dạng sản phẩm\n\nTất cả đều chính hãng 100%!";
  }

  // Câu hỏi về chính hãng
  if (lowerMessage.includes("chính hãng") || lowerMessage.includes("authentic") || lowerMessage.includes("hàng thật")) {
    return "Chúng tôi hợp tác trực tiếp với IKA Sport và các nhà phân phối lớn, đảm bảo 100% chính hãng. Tất cả sản phẩm đều có bảo hành và chứng nhận xuất xứ.";
  }

  // Câu hỏi chung
  if (lowerMessage.includes("sản phẩm") || lowerMessage.includes("product") || lowerMessage.includes("có gì")) {
    return "Chúng tôi cung cấp đầy đủ sản phẩm Pickleball:\n\n✅ Vợt Pickleball (Paddles)\n✅ Bóng Pickleball\n✅ Túi đựng vợt\n✅ Giày chơi Pickleball\n✅ Quần áo thể thao\n✅ Lưới và thiết bị sân chơi\n\nBạn có thể xem tất cả sản phẩm trên trang Products!";
  }

  // Câu hỏi về trình độ
  if (lowerMessage.includes("mới bắt đầu") || lowerMessage.includes("beginner") || lowerMessage.includes("người mới")) {
    return "Cho người mới bắt đầu, tôi khuyên bạn:\n\n1. **Vợt:** Chọn vợt All-around, giá từ 2.000.000₫ - 3.500.000₫\n2. **Bóng:** Bộ bóng tập 100 quả để luyện tập\n3. **Túi:** Túi đựng vợt cơ bản\n\nBạn có thể xem các combo dành cho người mới trên website!";
  }

  // Default response
  return "Cảm ơn bạn đã liên hệ! Tôi có thể giúp bạn tìm hiểu về:\n\n- Vợt Pickleball và cách chọn\n- Bóng Pickleball (outdoor/indoor)\n- Phụ kiện (túi, giày, quần áo)\n- Giá cả và chương trình khuyến mãi\n- Giao hàng và thanh toán\n\nBạn muốn biết thêm về điều gì? Hoặc bạn có thể xem chi tiết sản phẩm trên trang Products của chúng tôi!";
}

