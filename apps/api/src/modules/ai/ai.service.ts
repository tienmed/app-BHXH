import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly token = process.env.API_AI_TOKEN || "ab2bdaa449cc75202b51047e853e09aad2f40503a581ab0a9c5e358ebe6756d6";
  private readonly baseUrl = "https://pnt.badt.vn";

  async callGemma(prompt: string): Promise<string> {
    try {
      this.logger.log("Calling Gemma4 for clinical insight...");
      const response = await fetch(`${this.baseUrl}/gemma4/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({
          model: "gemma-3-4b-it",
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      this.logger.error(`AI Error (Gemma): ${(error as Error).message}`);
      return "";
    }
  }

  async callQwen(prompt: string): Promise<string> {
    try {
      this.logger.log("Calling Qwen3 for reasoning...");
      const response = await fetch(`${this.baseUrl}/qwen3/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({
          model: "qwen3-claude-distill",
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      this.logger.error(`AI Error (Qwen): ${(error as Error).message}`);
      return "";
    }
  }

  async getClinicalReview(context: { diagnoses: any[], recommendations: any[], alerts: any[] }): Promise<string> {
    const prompt = `
Bạn là chuyên gia CDSS cho Phòng khám ĐA KHOA. Review ca bệnh:
1. Chẩn đoán: ${context.diagnoses.map(d => `${d.icd} - ${d.label}`).join(", ")}
2. Chỉ định: ${context.recommendations.map(r => r.name).join(", ")}
3. Cảnh báo BHYT: ${context.alerts.map(a => a.message).join("; ")}

Yêu cầu: Chỉ ra rủi ro xuất toán và gợi ý lâm sàng ngắn gọn (3 ý).
`;
    return this.callGemma(prompt);
  }

  async chatWithDoctor(history: { role: string, content: string }[], context: any): Promise<string> {
    const systemPrompt = `Bạn là trợ lý bác sĩ tại Phòng khám Đa khoa Phạm Ngọc Thạch.
Ngữ cảnh ca bệnh hiện tại:
- Chẩn đoán: ${context.diagnoses.map((d: any) => d.label).join(", ")}
- Chỉ định đang chọn: ${context.selectedItems.join(", ")}

Hãy trả lời câu hỏi của bác sĩ một cách chuyên nghiệp, chính xác và ngắn gọn.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    try {
      const response = await fetch(`${this.baseUrl}/qwen3/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({
          model: "qwen3-claude-distill",
          messages,
          stream: false
        })
      });
      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      return "Xin lỗi, tôi gặp sự cố khi kết nối với hệ thống AI.";
    }
  }

  async checkAdvancedInteractions(medications: string[]): Promise<string> {
    if (medications.length < 2) return "";
    const prompt = `Kiểm tra tương tác thuốc lâm sàng nâng cao cho danh sách sau: ${medications.join(", ")}. 
Chỉ nêu các tương tác NẶNG hoặc CẦN LƯU Ý. Nếu không có gì nguy hiểm, trả về "Không phát hiện tương tác thuốc đáng ngại".`;
    return this.callGemma(prompt);
  }

  async generatePatientGuide(context: { diagnoses: string[], medications: string[], cls: string[] }): Promise<string> {
    const prompt = `Hãy soạn một bản hướng dẫn bệnh nhân dễ hiểu (không dùng thuật ngữ y khoa khó hiểu) cho ca bệnh:
- Chẩn đoán: ${context.diagnoses.join(", ")}
- Thuốc: ${context.medications.join(", ")}
- Cận lâm sàng cần làm: ${context.cls.join(", ")}

Yêu cầu: 
1. Cách dùng thuốc ngắn gọn.
2. Chế độ ăn uống/sinh hoạt cần lưu ý.
3. Dấu hiệu cần quay lại bệnh viện ngay.
Giọng văn ân cần, dễ đọc.`;
    return this.callGemma(prompt);
  }

  async rewriteClinicalContent(content: string, contextType: "note" | "alert" | "justification"): Promise<string> {
    if (!content || content.trim().length < 5) return content;
    
    const prompts = {
      note: `Hãy viết lại ghi chú lâm sàng sau cho tự nhiên và chuyên nghiệp hơn (giữ nguyên ý chính, không thêm thắt): "${content}"`,
      alert: `Hãy viết lại cảnh báo rủi ro BHYT sau cho bác sĩ dễ tiếp nhận hơn (vẫn giữ tính nghiêm túc và cảnh báo): "${content}"`,
      justification: `Hãy trau chuốt lại nội dung giải trình y khoa sau cho thuyết phục và đúng văn phong giám định: "${content}"`
    };

    try {
      // Set timeout for AI rewrite to ensure fallback works quickly
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

      const response = await fetch(`${this.baseUrl}/ai_agent/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
          "User-Agent": "Antigravity-Expert-Agent"
        },
        body: JSON.stringify({
          model: "ai-agent",
          messages: [{ role: "user", content: prompts[contextType] }],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status !== 403) {
           const errorText = await response.text();
           this.logger.error(`AI Rewrite HTTP Error: ${response.status} - ${errorText}`);
        }
        return content;
      }

      const data = await response.json();
      const rewritten = data.choices[0]?.message?.content?.trim();
      
      return (rewritten && rewritten.length > 5) ? rewritten : content;
    } catch (error) {
      this.logger.warn(`AI Rewrite failed for ${contextType}: ${(error as Error).message}`);
      return content; // Fallback to original
    }
  }
}
