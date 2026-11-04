// Columns: Simplified Chinese, Traditional Chinese, English, Japanese, Korean, Thai.
const messages = {
  driverPhotoTitle: ['驾驶证件与车牌合照', '駕駛證件與車牌合照', 'Driving document & plate photos', '運転書類とナンバープレートの写真', '운전 서류 및 차량 번호판 사진', 'ภาพเอกสารขับขี่พร้อมป้ายทะเบียน'],
  driverPhotoCarryTitle: ['驾驶时请随身携带证件', '駕駛時請隨身攜帶證件', 'Carry your documents when driving', '運転時は必要書類を携帯してください', '운전 시 필요한 서류를 휴대하세요', 'พกเอกสารที่จำเป็นขณะขับรถ'],
  driverPhotoCarryBody: ['依日本《道路交通法》，每位驾驶人（含额外驾驶人）驾驶时，均须携带适用且有效的驾驶证件。请在驾驶前确认已带齐相关证件。', '依日本《道路交通法》，每位駕駛人（含額外駕駛人）駕駛時，均須攜帶適用且有效的駕駛證件。請在駕駛前確認已帶齊相關證件。', 'Under Japan’s Road Traffic Act, every driver, including additional drivers, must carry the applicable valid driving documents while driving. Before driving, check that you have all required documents.', '日本の道路交通法により、追加運転者を含むすべての運転者は、運転時に必要な有効な運転書類を携帯する必要があります。運転前に必要書類がすべてそろっていることをご確認ください。', '일본 도로교통법에 따라 추가 운전자를 포함한 모든 운전자는 운전 시 해당하는 유효한 운전 서류를 휴대해야 합니다. 운전 전에 필요한 서류를 모두 챙겼는지 확인하세요.', 'ตามกฎหมายจราจรทางบกของญี่ปุ่น ผู้ขับขี่ทุกคนรวมถึงผู้ขับขี่เพิ่มเติมต้องพกเอกสารขับขี่ที่ถูกต้องและยังใช้ได้ขณะขับรถ โปรดตรวจสอบว่ามีเอกสารที่จำเป็นครบก่อนขับรถ'],
  driverPhotoIntro: ['请每位驾驶人拿出本人驾驶证件，与本次车辆拍摄一张合照，清楚显示前或后车牌号码。', '請每位駕駛人拿出本人駕駛證件，與本次車輛拍攝一張合照，清楚顯示前或後車牌號碼。', 'Take one photo per driver showing their original driving document together with this vehicle’s front or rear plate.', '各運転者の運転書類の原本と、この車両の前または後ろのナンバープレートが一緒に写る写真を1枚ずつ撮影してください。', '운전자마다 본인의 운전 서류 원본과 이 차량의 앞 또는 뒤 번호판이 함께 보이도록 사진 한 장을 촬영하세요.', 'ถ่ายภาพคนละหนึ่งภาพ ให้เห็นเอกสารขับขี่ฉบับจริงของผู้ขับขี่พร้อมป้ายทะเบียนด้านหน้าหรือหลังของรถคันนี้'],
  driverPhotoProgress: ['已上传 {count} / {total} 人', '已上傳 {count} / {total} 人', 'Uploaded for {count} / {total} drivers', '{total}名中{count}名の写真を保存済み', '{total}명 중 {count}명 업로드 완료', 'อัปโหลดแล้ว {count} / {total} คน'],
  driverPhotoPrimary: ['主驾驶人', '主駕駛人', 'Primary driver', '主な運転者', '주 운전자', 'ผู้ขับขี่หลัก'],
  driverPhotoAdditional: ['额外驾驶人', '額外駕駛人', 'Additional driver', '追加運転者', '추가 운전자', 'ผู้ขับขี่เพิ่มเติม'],
  driverPhotoPending: ['待拍摄', '待拍攝', 'Photo needed', '未撮影', '촬영 필요', 'รอถ่ายภาพ'],
  driverPhotoUploading: ['上传中', '上傳中', 'Uploading', '保存中', '업로드 중', 'กำลังอัปโหลด'],
  driverPhotoUploaded: ['已上传', '已上傳', 'Uploaded', '保存済み', '업로드 완료', 'อัปโหลดแล้ว'],
  driverPhotoFailed: ['上传失败', '上傳失敗', 'Upload failed', '保存できませんでした', '업로드 실패', 'อัปโหลดไม่สำเร็จ'],
  driverPhotoTake: ['拍照', '拍照', 'Take photo', '撮影する', '사진 촬영', 'ถ่ายภาพ'],
  driverPhotoRetake: ['重拍', '重拍', 'Retake', '撮り直す', '다시 촬영', 'ถ่ายใหม่'],
  driverPhotoView: ['查看照片', '查看照片', 'View photo', '写真を見る', '사진 보기', 'ดูภาพ'],
  driverPhotoRetry: ['重试', '重試', 'Retry', '再試行', '다시 시도', 'ลองอีกครั้ง'],
  driverPhotoLoading: ['正在读取驾驶人照片…', '正在讀取駕駛人照片…', 'Loading driver photos…', '運転者の写真を読み込み中…', '운전자 사진을 불러오는 중…', 'กำลังโหลดภาพผู้ขับขี่…'],
  driverPhotoLoadError: ['无法读取已保存照片，请重试；未恢复前不能继续。', '無法讀取已儲存照片，請重試；未恢復前不能繼續。', 'Saved photos could not be loaded. Retry before continuing.', '保存済みの写真を読み込めません。再試行してから続けてください。', '저장된 사진을 불러올 수 없습니다. 계속하기 전에 다시 시도하세요.', 'โหลดภาพที่บันทึกไว้ไม่ได้ โปรดลองอีกครั้งก่อนดำเนินการต่อ'],
  driverPhotoRosterMissing: ['暂时无法取得完整驾驶人名单，请联系门店后继续。', '暫時無法取得完整駕駛人名單，請聯絡門市後繼續。', 'The complete driver list is unavailable. Please contact the store before continuing.', '運転者一覧を取得できません。続ける前に店舗へご連絡ください。', '전체 운전자 명단을 불러올 수 없습니다. 계속하기 전에 지점에 문의하세요.', 'ไม่สามารถโหลดรายชื่อผู้ขับขี่ครบถ้วนได้ โปรดติดต่อสาขาก่อนดำเนินการต่อ'],
  driverPhotoInvalid: ['请选择可读取且不超过10MB的图片后重试。', '請選擇可讀取且不超過10MB的圖片後重試。', 'Choose a readable image of 10 MB or less and retry.', '読み取れる10MB以下の画像を選んで再試行してください。', '읽을 수 있는 10MB 이하 이미지를 선택하고 다시 시도하세요.', 'เลือกภาพที่อ่านได้ขนาดไม่เกิน 10 MB แล้วลองใหม่'],
  driverPhotoSaveError: ['照片未能保存，请重试或重拍。若无法打开相机，请检查相机权限或联系门店。', '照片未能儲存，請重試或重拍。若無法開啟相機，請檢查相機權限或聯絡門市。', 'The photo could not be saved. Retry or retake it. If the camera will not open, check camera permissions or contact the store.', '写真を保存できません。再試行または撮り直してください。カメラが開かない場合は権限を確認するか、店舗へご連絡ください。', '사진을 저장하지 못했습니다. 다시 시도하거나 촬영하세요. 카메라가 열리지 않으면 권한을 확인하거나 지점에 문의하세요.', 'บันทึกภาพไม่ได้ โปรดลองอีกครั้งหรือถ่ายใหม่ หากเปิดกล้องไม่ได้ให้ตรวจสอบสิทธิ์กล้องหรือติดต่อสาขา'],
  driverPhotoRequired: ['请完成每位已登记驾驶人的合照。', '請完成每位已登記駕駛人的合照。', 'Add a photo for every registered driver.', '登録されたすべての運転者の写真を追加してください。', '등록된 모든 운전자의 사진을 추가하세요.', 'โปรดเพิ่มภาพของผู้ขับขี่ที่ลงทะเบียนไว้ทุกคน'],
  driverPhotoPrivacy: ['照片用于本次租赁的证件与车辆留存。', '照片用於本次租賃的證件與車輛留存。', 'Photos record the driving documents and vehicle for this rental.', '写真は今回のレンタルの運転書類と車両の記録に使用します。', '사진은 이번 대여의 운전 서류와 차량 기록에 사용됩니다.', 'ภาพใช้บันทึกเอกสารขับขี่และรถสำหรับการเช่าครั้งนี้'],
  driverPhotoExample: ['查看示例', '查看示例', 'View example', '撮影例を見る', '예시 보기', 'ดูตัวอย่าง'],
  driverPhotoClose: ['关闭', '關閉', 'Close', '閉じる', '닫기', 'ปิด'],
} as const;

export type DriverPhotoKey = keyof typeof messages;
const languages = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'th'] as const;
export const driverPhotoTranslations = Object.fromEntries(languages.map((language, index) => [
  language, Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[index]])),
])) as Record<typeof languages[number], Record<DriverPhotoKey, string>>;
