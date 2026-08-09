import type { CardOrientation } from '@/types/tarot';

type CardTheme = {
  name: string;
  upright: string;
  reversed: string;
  focus: string;
};

export type VietnameseCardContext = {
  name: string;
  meaning: string;
  focus: string;
};

const MAJOR_THEMES: Record<string, CardTheme> = {
  'The Fool': {
    name: 'Kẻ Khờ',
    upright: 'một khởi đầu mới, tinh thần cởi mở và sự can đảm bước vào điều chưa biết',
    reversed: 'sự bốc đồng, thiếu chuẩn bị hoặc nỗi sợ khiến bước khởi đầu bị chệch hướng',
    focus: 'phân biệt niềm tin lành mạnh với một quyết định quá vội vàng'
  },
  'The Magician': {
    name: 'Nhà Ảo Thuật',
    upright: 'khả năng chủ động, tập trung nguồn lực và biến ý định thành hành động',
    reversed: 'năng lực đang bị phân tán, dùng sai cách hoặc chưa được phát huy thành hành động thật',
    focus: 'nhìn lại điều bạn đã có trong tay và cách bạn đang sử dụng nó'
  },
  'The High Priestess': {
    name: 'Nữ Tư Tế',
    upright: 'trực giác, sự tĩnh lặng và những điều chỉ sáng rõ khi bạn chịu lắng nghe bên trong',
    reversed: 'tiếng nói nội tâm bị lấn át, một bí mật gây nhiễu hoặc cảm giác thiếu tin tưởng chính mình',
    focus: 'chậm lại để nhận ra điều mình đã cảm thấy nhưng chưa gọi tên'
  },
  'The Empress': {
    name: 'Hoàng Hậu',
    upright: 'sự nuôi dưỡng, phong phú và khả năng làm cho một mối quan hệ hay kế hoạch lớn lên',
    reversed: 'sự chăm sóc mất cân bằng, cạn kiệt hoặc xu hướng bỏ quên nhu cầu của chính mình',
    focus: 'xem điều gì đang được nuôi dưỡng và ai đang phải cho đi quá nhiều'
  },
  'The Emperor': {
    name: 'Hoàng Đế',
    upright: 'cấu trúc, trách nhiệm, ranh giới rõ ràng và năng lực tạo sự ổn định',
    reversed: 'sự cứng nhắc, kiểm soát quá mức hoặc thiếu một nền tảng đủ vững',
    focus: 'thiết lập giới hạn rõ mà không biến chúng thành sự áp đặt'
  },
  'The Hierophant': {
    name: 'Giáo Hoàng',
    upright: 'giá trị chung, cam kết, truyền thống và bài học đến từ một khuôn khổ đáng tin',
    reversed: 'nhu cầu thoát khỏi khuôn mẫu cũ hoặc mâu thuẫn giữa niềm tin cá nhân và kỳ vọng bên ngoài',
    focus: 'xác định nguyên tắc nào thật sự thuộc về bạn'
  },
  'The Lovers': {
    name: 'Những Người Yêu Nhau',
    upright: 'sự hòa hợp, lựa chọn bằng cả trái tim lẫn giá trị sống và một kết nối có tính tương hỗ',
    reversed: 'lệch nhịp, thiếu đồng thuận hoặc một lựa chọn tình cảm chưa đi cùng trách nhiệm',
    focus: 'đối chiếu cảm xúc với giá trị và hành động thực tế của hai phía'
  },
  'The Chariot': {
    name: 'Cỗ Xe',
    upright: 'ý chí, định hướng rõ và khả năng tiến lên khi các lực kéo trái chiều được làm chủ',
    reversed: 'mất phương hướng, nóng vội hoặc cố tiến lên trong khi nội tâm còn xung đột',
    focus: 'chọn một hướng đi rõ thay vì để cảm xúc kéo về nhiều phía'
  },
  Strength: {
    name: 'Sức Mạnh',
    upright: 'nội lực, lòng kiên nhẫn và khả năng làm dịu tình huống bằng sự vững vàng',
    reversed: 'tự nghi ngờ, kiệt sức hoặc phản ứng mạnh vì bên trong đang thiếu an toàn',
    focus: 'dùng sự điềm tĩnh để dẫn dắt thay vì cố thắng bằng sức ép'
  },
  'The Hermit': {
    name: 'Ẩn Sĩ',
    upright: 'một khoảng lùi cần thiết để suy ngẫm, tự soi sáng và tìm câu trả lời chân thật',
    reversed: 'sự cô lập kéo dài, né tránh đối thoại hoặc lạc trong suy nghĩ của riêng mình',
    focus: 'phân biệt khoảng lặng chữa lành với việc tự tách mình khỏi hỗ trợ'
  },
  'Wheel of Fortune': {
    name: 'Bánh Xe Số Phận',
    upright: 'một chu kỳ đang chuyển động, cơ hội đổi chiều và những yếu tố ngoài dự tính',
    reversed: 'cảm giác mắc kẹt trong vòng lặp cũ hoặc chống lại một thay đổi khó tránh',
    focus: 'nhận ra phần bạn có thể chủ động khi hoàn cảnh đang đổi thay'
  },
  Justice: {
    name: 'Công Lý',
    upright: 'sự thật, trách nhiệm và kết quả được hình thành từ những lựa chọn trước đó',
    reversed: 'thiếu công bằng, né tránh trách nhiệm hoặc một góc nhìn đang bị thiên lệch',
    focus: 'kiểm tra sự nhất quán giữa lời nói, bằng chứng và hành động'
  },
  'The Hanged Man': {
    name: 'Người Treo Ngược',
    upright: 'sự tạm dừng có chủ đích, buông cách nhìn cũ và quan sát vấn đề từ một góc khác',
    reversed: 'trì hoãn không mục đích, hy sinh quá mức hoặc chưa chịu buông điều đã hết tác dụng',
    focus: 'xem điều gì cần được nhìn khác đi trước khi tiếp tục hành động'
  },
  Death: {
    name: 'Cái Chết',
    upright: 'sự kết thúc cần thiết, chuyển hóa và dọn chỗ cho một giai đoạn mới',
    reversed: 'bám giữ quá khứ, sợ thay đổi hoặc kéo dài một điều đã đến lúc khép lại',
    focus: 'nhận diện điều cần kết thúc để năng lượng mới có thể xuất hiện'
  },
  Temperance: {
    name: 'Tiết Chế',
    upright: 'sự điều hòa, kiên nhẫn và khả năng kết hợp khác biệt thành một nhịp cân bằng',
    reversed: 'quá đà, thiếu nhịp độ hoặc các nhu cầu chưa tìm được điểm dung hòa',
    focus: 'điều chỉnh từng chút thay vì ép tình huống thay đổi tức thì'
  },
  'The Devil': {
    name: 'Ác Quỷ',
    upright: 'sự ràng buộc, ham muốn mạnh và một khuôn mẫu đang âm thầm chi phối lựa chọn',
    reversed: 'bắt đầu nhận ra xiềng xích cũ và có cơ hội lấy lại quyền tự chủ',
    focus: 'gọi đúng tên điều khiến bạn lệ thuộc, sợ hãi hoặc khó buông'
  },
  'The Tower': {
    name: 'Tòa Tháp',
    upright: 'một sự thật đột ngột phá vỡ cấu trúc không còn bền vững',
    reversed: 'né tránh biến động, kéo dài khủng hoảng hoặc thay đổi đang diễn ra âm thầm bên trong',
    focus: 'giữ phần cốt lõi và để điều thiếu vững chắc được xây lại'
  },
  'The Star': {
    name: 'Ngôi Sao',
    upright: 'hy vọng, hồi phục và niềm tin trong trẻo sau một giai đoạn nhiều xáo trộn',
    reversed: 'mất kết nối với hy vọng, tự nghi ngờ hoặc chưa nhìn thấy tiến triển nhỏ đang có',
    focus: 'nuôi lại niềm tin bằng những dấu hiệu và hành động có thật'
  },
  'The Moon': {
    name: 'Mặt Trăng',
    upright: 'sự mơ hồ, cảm xúc sâu và những nỗi sợ khiến thực tế khó được nhìn trọn vẹn',
    reversed: 'màn sương đang dần tan hoặc một nỗi lo bị khuếch đại bắt đầu được nhận diện',
    focus: 'tách trực giác khỏi suy diễn bằng cách kiểm chứng điều bạn đang cảm thấy'
  },
  'The Sun': {
    name: 'Mặt Trời',
    upright: 'sự sáng rõ, niềm vui, sức sống và khả năng nhìn tình huống một cách cởi mở',
    reversed: 'niềm vui bị che mờ, kỳ vọng quá cao hoặc kết quả tích cực đến chậm hơn mong muốn',
    focus: 'ghi nhận điều tốt đang có mà không bỏ qua phần vẫn cần làm rõ'
  },
  Judgement: {
    name: 'Phán Xét',
    upright: 'sự thức tỉnh, nhìn lại quá khứ và đưa ra quyết định dựa trên một nhận thức trưởng thành hơn',
    reversed: 'tự phán xét nặng nề, né lời gọi thay đổi hoặc chưa rút được bài học từ chuyện cũ',
    focus: 'đánh giá lại bằng sự thành thật thay vì bằng mặc cảm'
  },
  'The World': {
    name: 'Thế Giới',
    upright: 'sự hoàn tất, hội tụ và cảm giác một hành trình đã đi đến độ chín',
    reversed: 'một vòng lặp chưa khép, chi tiết còn dang dở hoặc khó công nhận chặng đường đã đi',
    focus: 'hoàn thiện phần còn thiếu trước khi bước sang chu kỳ mới'
  }
};

const RANK_THEMES: Record<string, Omit<CardTheme, 'focus'>> = {
  Ace: { name: 'Át', upright: 'một hạt giống mới và tiềm năng đang mở ra', reversed: 'khởi đầu bị chậm, phân tán hoặc chưa được nuôi đúng cách' },
  Two: { name: 'Hai', upright: 'sự cân nhắc, kết nối và một lựa chọn cần giữ cân bằng', reversed: 'do dự, mất cân bằng hoặc hai phía chưa gặp được nhau' },
  Three: { name: 'Ba', upright: 'sự phát triển, phối hợp và kết quả đầu tiên bắt đầu hiện rõ', reversed: 'phối hợp thiếu nhịp, kỳ vọng lệch nhau hoặc tiến triển bị chia nhỏ' },
  Four: { name: 'Bốn', upright: 'nhu cầu tạo nền tảng, giữ ổn định và bảo toàn điều đang có', reversed: 'sự trì trệ, bồn chồn hoặc cấu trúc hiện tại đã trở nên quá chật' },
  Five: { name: 'Năm', upright: 'một thử thách buộc bạn nhìn thẳng vào mất mát, khác biệt hoặc xung đột', reversed: 'quá trình hồi phục đã bắt đầu nhưng vết cũ vẫn cần được xử lý' },
  Six: { name: 'Sáu', upright: 'sự chuyển tiếp, hỗ trợ và khả năng đưa tình huống về thế hài hòa hơn', reversed: 'tiến triển thiếu cân xứng hoặc một món nợ cảm xúc chưa được giải quyết' },
  Seven: { name: 'Bảy', upright: 'một phép thử về lựa chọn, chiến lược và niềm tin vào hướng đi', reversed: 'bối rối, né tránh hoặc thiếu cơ sở để tiếp tục bảo vệ lựa chọn hiện tại' },
  Eight: { name: 'Tám', upright: 'chuyển động có kỷ luật và năng lượng đang được dồn vào một hướng', reversed: 'trì hoãn, mắc kẹt hoặc nỗ lực chưa đi đúng điểm cần tác động' },
  Nine: { name: 'Chín', upright: 'giai đoạn gần hoàn tất, đòi hỏi sức bền và sự tự chủ', reversed: 'mệt mỏi, lo âu hoặc cố gắng kéo dài khi nguồn lực đã cạn' },
  Ten: { name: 'Mười', upright: 'điểm hoàn tất của một chu kỳ cùng toàn bộ kết quả và trách nhiệm đi kèm', reversed: 'gánh nặng quá mức hoặc sự chống cự trước việc khép lại một chu kỳ' },
  Page: { name: 'Tiểu Đồng', upright: 'một thông điệp mới, sự tò mò và tinh thần sẵn sàng học hỏi', reversed: 'non nớt, tin tức thiếu chắc chắn hoặc chưa biết biến ý tưởng thành hành động' },
  Knight: { name: 'Hiệp Sĩ', upright: 'động lực theo đuổi mục tiêu và bước tiến mang tính chủ động', reversed: 'nóng vội, cực đoan hoặc hành động không còn giữ được phương hướng' },
  Queen: { name: 'Nữ Hoàng', upright: 'sự trưởng thành từ bên trong và khả năng nâng đỡ năng lượng của bộ bài', reversed: 'bất an, khép kín hoặc dùng sự chăm sóc và ảnh hưởng theo cách mất cân bằng' },
  King: { name: 'Vua', upright: 'khả năng làm chủ, dẫn dắt và chịu trách nhiệm với lựa chọn', reversed: 'cứng nhắc, lạm dụng quyền kiểm soát hoặc thiếu trách nhiệm trong cách dẫn dắt' }
};

const SUIT_THEMES: Record<string, { name: string; focus: string }> = {
  Cups: {
    name: 'Cốc',
    focus: 'cảm xúc, tình yêu, sự đồng cảm và cách hai người trao nhận tình cảm'
  },
  Swords: {
    name: 'Kiếm',
    focus: 'suy nghĩ, giao tiếp, sự thật và những xung đột cần được gọi tên'
  },
  Wands: {
    name: 'Gậy',
    focus: 'động lực, đam mê, sáng tạo và cách năng lượng được chuyển thành hành động'
  },
  Pentacles: {
    name: 'Tiền',
    focus: 'sự ổn định, công việc, tài chính, cơ thể và những gì có thể kiểm chứng trong thực tế'
  }
};

export function getVietnameseCardContext(
  cardName: string,
  orientation: CardOrientation
): VietnameseCardContext {
  const majorTheme = MAJOR_THEMES[cardName];

  if (majorTheme) {
    return {
      name: majorTheme.name,
      meaning: orientation === 'UPRIGHT' ? majorTheme.upright : majorTheme.reversed,
      focus: majorTheme.focus
    };
  }

  const match = cardName.match(/^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Cups|Swords|Wands|Pentacles)$/);
  const rank = match ? RANK_THEMES[match[1]] : undefined;
  const suit = match ? SUIT_THEMES[match[2]] : undefined;

  if (rank && suit) {
    return {
      name: `${rank.name} ${suit.name}`,
      meaning: orientation === 'UPRIGHT' ? rank.upright : rank.reversed,
      focus: suit.focus
    };
  }

  return {
    name: 'Lá bài chưa định danh',
    meaning: orientation === 'UPRIGHT'
      ? 'một tín hiệu cần được quan sát bằng sự cởi mở và bình tĩnh'
      : 'một năng lượng đang bị chặn hoặc cần được nhìn từ hướng khác',
    focus: 'điều đang lặp lại rõ nhất trong hoàn cảnh thực tế của bạn'
  };
}

export function localizeTarotTerms(text: string) {
  let localizedText = text;

  for (const [englishName, theme] of Object.entries(MAJOR_THEMES)) {
    localizedText = localizedText.replaceAll(englishName, theme.name);
  }

  for (const [englishRank, rank] of Object.entries(RANK_THEMES)) {
    for (const [englishSuit, suit] of Object.entries(SUIT_THEMES)) {
      localizedText = localizedText.replaceAll(
        `${englishRank} of ${englishSuit}`,
        `${rank.name} ${suit.name}`
      );
    }
  }

  return localizedText
    .replace(/\bupright\b/gi, 'xuôi')
    .replace(/\breversed\b/gi, 'ngược');
}
