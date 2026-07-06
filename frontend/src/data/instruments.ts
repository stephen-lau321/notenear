// Art discipline categories — 统称为"艺术"
export interface InstrumentCategory {
  category: string;
  instruments: { name: string }[];
}

export const instrumentCategories: InstrumentCategory[] = [
  // ===== 音乐类 =====
  {
    category: "键盘乐器",
    instruments: [{ name: "钢琴" }, { name: "电子琴" }, { name: "手风琴" }, { name: "双排键" }],
  },
  {
    category: "西洋弦乐器",
    instruments: [{ name: "小提琴" }, { name: "中提琴" }, { name: "大提琴" }, { name: "古典吉他" }, { name: "尤克里里" }],
  },
  {
    category: "民族弹拨乐器",
    instruments: [{ name: "古筝" }, { name: "琵琶" }, { name: "扬琴" }, { name: "阮" }, { name: "柳琴" }],
  },
  {
    category: "民乐拉弦乐器",
    instruments: [{ name: "二胡" }, { name: "京胡" }, { name: "板胡" }, { name: "高胡" }, { name: "马头琴" }],
  },
  {
    category: "民族吹管乐器",
    instruments: [{ name: "竹笛" }, { name: "箫" }, { name: "唢呐" }, { name: "葫芦丝" }, { name: "巴乌" }],
  },
  {
    category: "西洋管乐器",
    instruments: [{ name: "萨克斯" }, { name: "长笛" }, { name: "单簧管" }, { name: "双簧管" }, { name: "小号" }, { name: "圆号" }, { name: "长号" }],
  },
  {
    category: "打击乐器",
    instruments: [{ name: "架子鼓" }, { name: "小军鼓" }, { name: "定音鼓" }, { name: "马林巴" }, { name: "非洲鼓" }, { name: "中国鼓" }],
  },
  {
    category: "声乐",
    instruments: [{ name: "美声唱法" }, { name: "民族唱法" }, { name: "通俗唱法" }, { name: "童声" }, { name: "合唱" }],
  },
  {
    category: "音乐制作与调律",
    instruments: [
      { name: "钢琴调律" },
      { name: "器乐维修" },
      { name: "乐器制造" },
      { name: "音乐制作" },
      { name: "录音艺术" },
      { name: "混音母带" },
      { name: "数字音频" },
    ],
  },
  {
    category: "音乐综合",
    instruments: [{ name: "音乐素养" }, { name: "视唱练耳" }, { name: "乐理" }, { name: "作曲" }, { name: "指挥" }],
  },
  // ===== 美术类 =====
  {
    category: "绘画",
    instruments: [{ name: "素描" }, { name: "水彩" }, { name: "水粉" }, { name: "油画" }, { name: "国画" }, { name: "版画" }, { name: "彩铅" }, { name: "马克笔绘画" }, { name: "丙烯画" }],
  },
  {
    category: "美术综合",
    instruments: [{ name: "创意美术" }, { name: "线描" }, { name: "速写" }, { name: "插画" }, { name: "漫画" }, { name: "综合材料" }, { name: "美术鉴赏" }],
  },
  {
    category: "雕塑与手工",
    instruments: [{ name: "陶艺" }, { name: "泥塑" }, { name: "纸艺" }, { name: "粘土手工" }, { name: "编织手作" }, { name: "木工手作" }],
  },
  // ===== 舞蹈类 =====
  {
    category: "舞蹈",
    instruments: [{ name: "中国舞" }, { name: "芭蕾舞" }, { name: "街舞" }, { name: "爵士舞" }, { name: "拉丁舞" }, { name: "现代舞" }, { name: "民族民间舞" }, { name: "古典舞" }, { name: "踢踏舞" }, { name: "肚皮舞" }],
  },
  // ===== 书法类 =====
  {
    category: "书法篆刻",
    instruments: [{ name: "硬笔书法" }, { name: "软笔书法" }, { name: "篆刻" }, { name: "隶书专攻" }, { name: "楷书专攻" }, { name: "行书专攻" }, { name: "草书专攻" }],
  },
  // ===== 体育类 =====
  {
    category: "球类运动",
    instruments: [{ name: "篮球" }, { name: "足球" }, { name: "排球" }, { name: "乒乓球" }, { name: "羽毛球" }, { name: "网球" }, { name: "高尔夫" }],
  },
  {
    category: "武术与搏击",
    instruments: [{ name: "武术" }, { name: "太极拳" }, { name: "跆拳道" }, { name: "空手道" }, { name: "柔道" }, { name: "散打" }, { name: "拳击" }],
  },
  {
    category: "水上与冰雪",
    instruments: [{ name: "游泳" }, { name: "花样游泳" }, { name: "跳水" }, { name: "滑冰" }, { name: "滑雪" }],
  },
  {
    category: "体能与健身",
    instruments: [{ name: "体适能" }, { name: "瑜伽" }, { name: "普拉提" }, { name: "健美操" }, { name: "跑酷" }, { name: "攀岩" }],
  },
  // ===== 科学类 =====
  {
    category: "科学与技术",
    instruments: [{ name: "科学实验" }, { name: "趣味物理" }, { name: "趣味化学" }, { name: "天文观测" }, { name: "生物探索" }, { name: "STEM综合" }, { name: "编程启蒙" }, { name: "机器人" }, { name: "3D打印" }, { name: "无人机" }],
  },
  // ===== 语言艺术类 =====
  {
    category: "语言艺术",
    instruments: [{ name: "朗诵" }, { name: "主持" }, { name: "演讲" }, { name: "辩论" }, { name: "戏剧表演" }, { name: "相声快板" }, { name: "讲故事" }, { name: "配音" }],
  },
];

export function getAllInstrumentNames(): string[] {
  return instrumentCategories.flatMap((c) => c.instruments.map((i) => i.name));
}
