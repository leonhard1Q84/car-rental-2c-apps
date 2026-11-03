// Columns: Simplified Chinese, Traditional Chinese, English, Japanese, Korean, Thai.
const messages = {
  tripRatingTitle: ['请为这次用车体验评分', '請為這次用車體驗評分', 'Rate your rental experience', '今回のご利用体験を評価してください', '이번 차량 이용 경험을 평가해 주세요', 'ให้คะแนนประสบการณ์เช่ารถครั้งนี้'],
  tripRatingHint: ['选择1～5分，分享您的感受，帮助我们改善服务。', '選擇1～5分，分享您的感受，幫助我們改善服務。', 'Choose a score from 1 to 5. Your feedback helps us improve.', '1～5の点数をお選びください。ご意見はサービス改善に役立てます。', '1~5점을 선택해 주세요. 고객님의 의견은 서비스 개선에 도움이 됩니다.', 'เลือกคะแนน 1–5 เพื่อแบ่งปันความรู้สึกและช่วยเราปรับปรุงบริการ'],
  tripRatingVeryDissatisfied: ['非常不满意', '非常不滿意', 'Very dissatisfied', 'とても不満', '매우 불만족', 'ไม่พอใจอย่างยิ่ง'],
  tripRatingDissatisfied: ['不满意', '不滿意', 'Dissatisfied', '不満', '불만족', 'ไม่พอใจ'],
  tripRatingNeutral: ['一般', '一般', 'Neutral', '普通', '보통', 'เฉย ๆ'],
  tripRatingSatisfied: ['满意', '滿意', 'Satisfied', '満足', '만족', 'พอใจ'],
  tripRatingVerySatisfied: ['非常满意', '非常滿意', 'Very satisfied', 'とても満足', '매우 만족', 'พอใจอย่างยิ่ง'],
  tripRatingOptionLabel: ['{score}分 · {label}', '{score}分 · {label}', '{score} out of 5 · {label}', '{score}点 · {label}', '{score}점 · {label}', '{score} จาก 5 คะแนน · {label}'],
  tripRatingCommentLabel: ["补充说明（选填）", "補充說明（選填）", "Additional comments (optional)", "補足コメント（任意）", "추가 의견 (선택)", "ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"],
  tripRatingCommentPlaceholder: ["可以描述遇到的问题，也欢迎分享做得好的地方。", "可以描述遇到的問題，也歡迎分享做得好的地方。", "Describe any issues, or tell us what went well.", "お困りの点や良かった点をお聞かせください。", "겪으신 문제나 좋았던 점을 알려 주세요.", "อธิบายปัญหาที่พบ หรือแบ่งปันสิ่งที่ทำได้ดี"],
  tripRatingSubmit: ['提交评价', '送出評價', 'Submit review', '評価を送信', '평가 제출', 'ส่งรีวิว'],
  tripRatingSubmittedTitle: ['感谢您的评价！', '感謝您的評價！', 'Thank you for your review!', '評価ありがとうございます！', '평가해 주셔서 감사합니다!', 'ขอบคุณสำหรับรีวิว!'],
  tripRatingSubmittedBody: ['您的意见能帮助我们改善服务。', '您的意見能幫助我們改善服務。', 'Your feedback helps us improve our service.', 'ご意見はサービス改善に役立てます。', '고객님의 의견은 서비스 개선에 도움이 됩니다.', 'ความคิดเห็นของคุณช่วยให้เราปรับปรุงบริการ'],
  tripRatingDismiss: ['关闭评价', '關閉評價', 'Dismiss review', '評価を閉じる', '평가 닫기', 'ปิดรีวิว'],
  tripRatingIssuesLabel: ["哪些地方需要改进？（选填，可多选）", "哪些地方需要改進？（選填，可多選）", "What could we improve? (optional, select all that apply)", "改善してほしい点はありますか？（任意・複数選択可）", "어떤 점을 개선하면 좋을까요? (선택, 복수 선택 가능)", "มีสิ่งใดที่ควรปรับปรุง? (ไม่บังคับ เลือกได้หลายข้อ)"],
  tripRatingIssueFinding: ["找车或定位困难", "找車或定位困難", "Difficulty finding or locating the vehicle", "車の場所が分かりにくい", "차량 위치를 찾기 어려움", "หารถหรือตำแหน่งรถได้ยาก"],
  tripRatingIssueGuidance: ["取还车指引不清晰", "取還車指引不清晰", "Unclear pickup or return instructions", "受取・返却の案内が分かりにくい", "차량 인수·반납 안내가 불명확함", "คำแนะนำการรับหรือคืนรถไม่ชัดเจน"],
  tripRatingIssueRemoteLock: ["远程开锁或关锁不顺畅", "遠端解鎖或上鎖不順暢", "Problems remotely unlocking or locking the vehicle", "遠隔での解錠・施錠がスムーズにできない", "원격 잠금 해제 또는 잠금이 원활하지 않음", "ปลดล็อกหรือล็อกรถจากระยะไกลได้ไม่ราบรื่น"],
  tripRatingIssueMessages: ["页面提示难理解", "頁面提示難理解", "Hard-to-understand messages on the page", "画面のメッセージが分かりにくい", "화면 안내를 이해하기 어려움", "ข้อความแนะนำบนหน้าจอเข้าใจยาก"],
  tripRatingIssueVehicle: ["车辆状况不满意", "車輛狀況不滿意", "Unsatisfactory vehicle condition", "車の状態に不満がある", "차량 상태가 만족스럽지 않음", "ไม่พอใจสภาพรถ"],
  tripRatingIssueService: ["客服服务不满意", "客服服務不滿意", "Unsatisfactory customer service", "カスタマーサービスに不満がある", "고객 서비스가 만족스럽지 않음", "ไม่พอใจการบริการลูกค้า"],
  tripRatingIssueOther: ["其他问题", "其他問題", "Other issues", "その他の問題", "기타 문제", "ปัญหาอื่น ๆ"],
  tripRatingOtherCommentLabel: ["其它问题详细内容（选填）", "其他問題詳細內容（選填）", "Other issue details (optional)", "その他の問題の詳細（任意）", "기타 문제 상세 내용 (선택)", "รายละเอียดปัญหาอื่น ๆ (ไม่บังคับ)"],
  tripRatingOtherCommentPlaceholder: ["请描述其它问题的详细内容。", "請描述其他問題的詳細內容。", "Please describe the other issues in detail.", "その他の問題の詳細をご記入ください。", "기타 문제의 자세한 내용을 입력해 주세요.", "โปรดอธิบายรายละเอียดของปัญหาอื่น ๆ"],
  tripRatingCommentLimit: ["最多可输入 300 字", "最多可輸入 300 字", "You can enter up to 300 characters.", "300文字まで入力できます。", "최대 300자까지 입력할 수 있습니다.", "กรอกได้สูงสุด 300 อักขระ"],
} as const;

export type CustomerTripEndedKey = keyof typeof messages;
const languages = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th'] as const;
export const customerTripEndedMessages = Object.fromEntries(languages.map((language, index) => [
  language, Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])),
])) as Record<typeof languages[number], Record<CustomerTripEndedKey, string>>;
