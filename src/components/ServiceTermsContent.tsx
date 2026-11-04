import React from 'react';

interface ServiceTermsContentProps {
  className?: string;
}

const ServiceTermsContent: React.FC<ServiceTermsContentProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <h2 className="text-xl font-bold text-gray-900 border-b pb-2">遠端租還車服務說明（草案）</h2>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">一、服務方式概述</h3>
        <div className="space-y-2 pl-2">
          <p className="font-semibold">1）送車安排</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>我司工作人員將在客戶預定開始時間之前，將車輛停放在距離客戶預定地址約【0.5】公里範圍內的合法停車場（具體停車場位置由我司根據當日車位情況決定，並通過客服/系統通知客戶）。</li>
            <li>客戶到場取車後，自行完成取車手續並駕駛離開。</li>
          </ul>

          <p className="font-semibold mt-3">2）取車停車費</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>客戶取車時產生的停車場費用原則上由客戶支付。</li>
            <li>“取車停車費”上限暫定為最高【4,000日圓】（以停車場實際出票/電子記錄為準）。</li>
            <li>如停車費超過上述上限，超出部分由我司承擔。</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">二、取車流程與注意事項</h3>
        <div className="space-y-2 pl-2">
          <p className="font-semibold">1）取車前</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>客服將向客戶發送車輛停放位置、車位信息/車牌信息、車輛外觀照片與注意事項。</li>
            <li>為避免糾紛，建議客戶取車時自行拍攝以下照片/視頻留存：車牌、儀表盤里程與油量、車身四周（含輪轂）、車內衛生狀況。</li>
          </ul>

          <p className="font-semibold mt-3">2）取車時的確認</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若發現車輛存在明顯新增損傷、異常警告燈、無法正常啟動車輛等情況，請勿擅自駛離，並立即聯繫我司客服處理。</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">三、還車流程（必須提前聯繫）</h3>
        <div className="space-y-2 pl-2">
          <p className="font-semibold">1）還車前聯繫義務</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>客戶在還車前必須聯繫我司客服確認還車安排。</li>
            <li>未經聯繫或未獲得確認而自行還車/留車，可能產生額外費用、罰金或法律風險，相關責任由客戶承擔。</li>
          </ul>

          <p className="font-semibold mt-3">2）正常情況下的還車方式</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>客戶可在預定還車地點附近自行尋找任意合法停車場還車，並將停車場信息（名稱/地址/車位號）、車輛照片等按客服/系統指示完成提交。</li>
            <li>為避免高額停車費與風險，客戶選擇的停車場需滿足下述條件（除非得到我司工作人員明確許可）：
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>不得為“無上限（最大料金なし/上限なし）”或可能持續累加的停車場；</li>
                <li>若為“最大料金”停車場：當日/24小時最大料金不得超過【4,000日圓】；</li>
                <li>若還車時處於夜間：夜間最大料金 + 次日可能產生的最大金額合計不得超過【5,000日圓】；</li>
                <li>如附近有我司工作人員推薦的停車場，或經工作人員同意，可不受上述限制。</li>
              </ol>
            </li>
          </ul>

          <p className="font-semibold mt-3">3）禁止還車地點（嚴格禁止）</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>禁止未經許可停放在標註“月極（包月）”的車位或停車場。</li>
            <li>禁止在無法長時間合法停車的地點還車（例如路邊臨停區域、parking meter等），除非我司工作人員明確指定並確認可行。</li>
            <li>禁止在法律禁止停車區域還車，禁止以任何形式“遺棄車輛”。</li>
            <li>禁止將車輛停放在可能導致拖車、罰單或妨礙交通的位置。</li>
            <li>客戶未按規定地點/方式還車導致的罰金、拖車費、停車費、行政費用及我司代處理手續費，均由客戶承擔。</li>
          </ul>

          <p className="font-semibold mt-3">4）還車停車費承擔</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若客戶選擇的停車場符合本說明要求，客戶通常無需承擔還車停車費。</li>
            <li>若客戶未按要求選擇停車場或導致產生額外停車費/罰金/法律風險，我司有權向客戶追償相關費用，並可能從押金/保證金中扣除（以合同/規則為準）。</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">四、還車結算與可能產生的費用</h3>
        <p className="text-gray-600 mb-2">還車時（或發生時）客戶需結算以下費用（如適用）：</p>
        <div className="space-y-2 pl-2">
          <p className="font-semibold">1）ETC費用</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>客戶需支付實際使用的高速通行費（ETC卡內金額數據）。</li>
          </ul>
          <p className="font-semibold">2）燃油費用（不滿油歸還）</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若未按約定油量歸還（例如未加滿/低於交車時油量），客戶需支付燃油差額費用及我司規定的服務費（具體計價方式以合同/價格表為準）。</li>
          </ul>
          <p className="font-semibold">3）車輛清潔費</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若還車時車內有大量垃圾、明顯異味、大片污漬、需要額外清潔的情況，客戶需支付清潔費（標準以價格表/現場判定為準）。</li>
          </ul>
          <p className="font-semibold">4）延時費用與超時費用</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若客戶延時或未按時歸還，將產生相應費用。</li>
            <li>特別說明：未經聯繫擅自延遲還車可能產生“超時費用”；超時費用不包含已預約/同意的延時費用，需在還車時另行結算。</li>
          </ul>
          <p className="font-semibold">5）臨時加購/追加項目</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>例如臨時加購ETC卡、追加服務、變更還車方式等附加項目，需在當時或還車時結算（以客服確認記錄為準）。</li>
          </ul>
          <p className="font-semibold">6）未插入ETC卡通過高速出入口的處理費</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若發生“未插入ETC卡”通過高速出入口並收到相關通知的情況，請務必提前聯繫我司客服，並在還車時支付【2,500日圓/次】的高速費用（含代處理手續費）。</li>
            <li>多次發生將按次數累計計費。</li>
          </ul>
          <p className="font-semibold">7）新增損傷/事故處理</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若還車時發現車輛存在交車時沒有的損傷，或租用期間發生事故/剮蹭，請立即聯繫我司客服。</li>
            <li>我司可能要求客戶將車輛歸還至客服指定的最近店鋪/地點，以便進行事故處理與保險流程。</li>
            <li>未及時通知、擅自處理或隱瞞事故，可能影響保險理賠並導致客戶承擔額外費用（以保險條款與合同為準）。</li>
          </ul>
          <p className="font-semibold">8）罰單與違法處理（含代處理費用）</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>租用期間如收到罰單（例如違法停車等），客戶原則上應自行前往附近警署/相關機構辦理繳納與手續。</li>
            <li>若客戶拒不處理、逾期未處理或客觀上無法自行解決，我司可能在還車時扣除相應罰金及代處理手續費。</li>
            <li>參考：違法停車相關費用約【18,000日圓/次（含代處理手續費）】（實際金額以合同及約款為準）。</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">五、客戶應配合事項</h3>
        <div className="space-y-2 pl-2">
          <p className="font-semibold">1）取車與還車時的照片取證</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>建議客戶在取車與還車時分別拍照/錄視頻，覆蓋車身四周、輪轂、車內、油量、里程、停車位置與周邊標識，用於避免爭議。</li>
          </ul>
          <p className="font-semibold mt-3">2）車輛與文件交接</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>若遺失車內提供的物品/文件，將產生對應賠償與處理費用（以合同為準）。</li>
          </ul>
        </div>
      </section>

      <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-bold text-yellow-900 mb-2">六、重要提示</h3>
        <ul className="list-disc pl-5 space-y-1 text-yellow-800">
          <li>本服務為“遠端交付+遠端歸還”模式，停車與還車地點的合法性、可長期停放性、最大料金條件等將直接影響費用與法律風險。請務必遵循客服指示，並在還車前聯繫確認。</li>
          <li>如與租賃合同、價格表、保險條款存在不一致，以合同/條款為準。</li>
        </ul>
      </section>
    </div>
  );
};

export default ServiceTermsContent;
