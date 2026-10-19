const md = (f) => new URL(f, import.meta.url).href;

export const unit = {
  id: 'ai-u05',
  title: '廣告素材與圖片生成',
  lessons: [
    {
      id: 'ai-u05-l01',
      title: 'AI 圖片工具實戰：Midjourney、DALL-E 與商業使用注意事項',
      minutes: 20,
      objectives: [
        '了解主流 AI 圖片工具的差異與使用場景',
        '學會寫出有效的圖片生成 prompt',
        '了解 AI 圖片的著作權與商業使用限制',
      ],
      body: md('./l01.md'),
      exercises: [
        {
          id: 'ai.u05.l01.q01',
          type: 'mcq',
          title: '工具選擇',
          question: '你要生成一張台灣電商廣告用的「女性模特兒手持產品」照片感圖片，哪個工具組合最適合？',
          options: [
            'A. Midjourney — 生成寫實風格人物圖最穩定',
            'B. Google 搜尋找免費圖片',
            'C. ChatGPT 的文字描述功能',
            'D. Excel 的 SmartArt',
          ],
          answer: 0,
          explanation: 'Midjourney 在生成寫實風格的人物、產品廣告圖方面品質最穩定，尤其是 V6 之後的版本在人物細節和光影上有顯著提升。商業使用需要付費方案（Basic 或以上）。DALL-E 也可以生成人物但風格較偏插畫感；Stable Diffusion 需要更多技術設定。',
        },
        {
          id: 'ai.u05.l01.q02',
          type: 'mcq',
          title: 'Prompt 結構',
          question: '下列哪個 Midjourney prompt 最可能生成高品質的廣告素材？',
          options: [
            'A. 「beautiful woman with product」',
            'B. 「a photo of coffee」',
            'C. 「flat lay product photography, ceramic coffee mug with steam, morning light, minimalist style, white marble background, soft shadows, commercial photography quality, 4K --ar 4:5」',
            'D. 「make me a good image for my ad」',
          ],
          answer: 2,
          explanation: '好的 Midjourney prompt 需要包含：拍攝風格（flat lay product photography）、主體描述（ceramic coffee mug with steam）、光線（morning light）、風格（minimalist）、背景（white marble background）、品質要求（commercial photography quality）、和圖片比例（--ar 4:5 適合 Instagram）。越具體的描述越能控制輸出結果。',
        },
        {
          id: 'ai.u05.l01.q03',
          type: 'mcq',
          title: '著作權與商業使用',
          question: '關於 AI 生成圖片的商業使用，下列哪個說法**正確**？',
          options: [
            'A. AI 生成的圖片完全沒有著作權問題，可以隨意商業使用',
            'B. 免費版的 AI 圖片工具生成的圖片，通常不能用於商業用途，需要付費方案才有商業授權',
            'C. 只要圖片是 AI 生成的，就不需要考慮著作權',
            'D. AI 圖片在全球都已有統一的商業使用法規',
          ],
          answer: 1,
          explanation: '大多數 AI 圖片工具（包含 Midjourney、DALL-E）的免費版或低費方案不包含商業使用授權，需要升級付費方案。Midjourney Basic 方案（每月 $10）及以上才有商業授權；DALL-E 透過 OpenAI API 使用時生成的圖片可商業使用。另外，AI 圖片的著作權歸屬在各國仍在發展中，台灣目前還沒有專門針對 AI 創作的著作權法規，使用前應確認各工具的服務條款。',
        },
      ],
    },
  ],
};
