// Seed script for street-music backend
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hash = bcrypt.hashSync("888888", 10);

  // Create an admin user
  const admin = await prisma.user.upsert({
    where: { phone: "13800000000" },
    update: { email: "admin@yuelin.com", passwordHash: hash, nickname: "系统管理员", role: "ADMIN" },
    create: {
      phone: "13800000000",
      email: "admin@yuelin.com",
      passwordHash: hash,
      nickname: "系统管理员",
      role: "ADMIN",
    },
  });
  console.log(`  ✓ Admin user created: ${admin.nickname} (role: ${admin.role})`);

  // Create a test teacher user
  const teacherUser = await prisma.user.upsert({
    where: { phone: "13900001111" },
    update: { email: "teacher@yuelin.com", passwordHash: hash, nickname: "李明", role: "TEACHER" },
    create: {
      phone: "13900001111",
      email: "teacher@yuelin.com",
      passwordHash: hash,
      nickname: "李明",
      role: "TEACHER",
    },
  });
  console.log(`  ✓ Teacher user created: ${teacherUser.nickname} (role: ${teacherUser.role})`);

  // Create teacher auth
  const teacherAuth = await prisma.teacherAuth.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      realName: "李明",
      status: "APPROVED",
      verifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Teacher auth approved`);

  // Create categorized instruments (by art education classification)
  await prisma.streetClaim.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.instrument.deleteMany({});

  const instrumentData = [
    ["钢琴","键盘乐器"],["电子琴","键盘乐器"],["手风琴","键盘乐器"],["双排键","键盘乐器"],
    ["小提琴","西洋弦乐器"],["中提琴","西洋弦乐器"],["大提琴","西洋弦乐器"],["古典吉他","西洋弦乐器"],["尤克里里","西洋弦乐器"],
    ["古筝","民族弹拨乐器"],["琵琶","民族弹拨乐器"],["扬琴","民族弹拨乐器"],["阮","民族弹拨乐器"],["柳琴","民族弹拨乐器"],
    ["二胡","民乐拉弦乐器"],["京胡","民乐拉弦乐器"],["板胡","民乐拉弦乐器"],["高胡","民乐拉弦乐器"],["马头琴","民乐拉弦乐器"],
    ["竹笛","民族吹管乐器"],["箫","民族吹管乐器"],["唢呐","民族吹管乐器"],["葫芦丝","民族吹管乐器"],["巴乌","民族吹管乐器"],
    ["萨克斯","西洋管乐器"],["长笛","西洋管乐器"],["单簧管","西洋管乐器"],["双簧管","西洋管乐器"],["小号","西洋管乐器"],["圆号","西洋管乐器"],["长号","西洋管乐器"],
    ["架子鼓","打击乐器"],["小军鼓","打击乐器"],["定音鼓","打击乐器"],["马林巴","打击乐器"],["非洲鼓","打击乐器"],["中国鼓","打击乐器"],
    ["美声唱法","声乐"],["民族唱法","声乐"],["通俗唱法","声乐"],["童声","声乐"],["合唱","声乐"],
    ["音乐素养","其他"],["视唱练耳","其他"],["乐理","其他"],["作曲","其他"],["指挥","其他"],
    ["钢琴调律","音乐制作与调律"],["器乐维修","音乐制作与调律"],["乐器制造","音乐制作与调律"],["音乐制作","音乐制作与调律"],["录音艺术","音乐制作与调律"],["混音母带","音乐制作与调律"],["数字音频","音乐制作与调律"],
  ];
  const instruments = [];
  for (const [name, category] of instrumentData) {
    await prisma.$executeRawUnsafe("INSERT INTO instruments (id, name, category) VALUES ('" + name + "', '" + name + "', '" + category + "')");
    instruments.push({ name, category });
  }
  console.log("  \u2713 " + instruments.length + " instruments with categories");

  // Create street claims
  const claims = [
    { streetName: "体育西路", instrument: "吉他", lat: 23.1317, lng: 113.3215, district: "天河区", city: "广州市" },
    { streetName: "建设路", instrument: "钢琴", lat: 23.1295, lng: 113.2823, district: "越秀区", city: "广州市" },
    { streetName: "江南大道", instrument: "古筝", lat: 23.0931, lng: 113.2720, district: "海珠区", city: "广州市" },
    { streetName: "解放路", instrument: "小提琴", lat: 23.1065, lng: 113.2605, district: "越秀区", city: "广州市" },
  ];

  for (const c of claims) {
    const instrument = await prisma.instrument.findFirst({ where: { name: c.instrument } });
    if (!instrument) continue;

    const existing = await prisma.streetClaim.findFirst({
      where: { streetName: c.streetName, instrumentId: instrument.id },
    });
    if (!existing) {
      await prisma.streetClaim.create({
        data: {
          teacherId: teacherAuth.id,
          instrumentId: instrument.id,
          streetName: c.streetName,
          district: c.district,
          city: c.city,
          province: "广东省",
          lat: c.lat,
          lng: c.lng,
          status: "ACTIVE",
        },
      });
    }
  }
  console.log(`  ✓ ${claims.length} street claims created`);

  // Create activities
  const activities = [
    { title: "🎵 周末吉他音乐沙龙", description: "带上你的吉他，一起来交流音乐心得。适合初学者和进阶玩家。", price: 9900 },
    { title: "🎹 钢琴名曲欣赏会", description: "现场演奏经典钢琴曲目，感受音乐之美。", price: 0 },
  ];

  for (const a of activities) {
    await prisma.activity.create({
      data: {
        teacherId: teacherUser.id,
        title: a.title,
        description: a.description,
        price: a.price,
        status: "APPROVED",
        eventTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`  ✓ ${activities.length} activities created`);

  // Create a second parent user (街坊/学员端)
  const parentUser = await prisma.user.upsert({
    where: { phone: "13900002222" },
    update: { email: "parent@yuelin.com", passwordHash: hash, nickname: "张妈妈", role: "PARENT" },
    create: {
      phone: "13900002222",
      email: "parent@yuelin.com",
      passwordHash: hash,
      nickname: "张妈妈",
      role: "PARENT",
    },
  });
  console.log(`  ✓ Parent user created: ${parentUser.nickname} (role: ${parentUser.role})`);

  // Create HOST users (生活链接者)
  const hostArt = await prisma.user.upsert({
    where: { phone: "13900003333" },
    update: { email: "host@yuelin.com", passwordHash: hash, nickname: "王老师", role: "HOST" },
    create: {
      phone: "13900003333",
      email: "host@yuelin.com",
      passwordHash: hash,
      nickname: "王老师",
      role: "HOST",
    },
  });
  console.log(`  ✓ Host (art backup) created: ${hostArt.nickname} (role: ${hostArt.role})`);

  const hostLife = await prisma.user.upsert({
    where: { phone: "13900004444" },
    update: { email: "host2@yuelin.com", passwordHash: hash, nickname: "赵师傅", role: "HOST" },
    create: {
      phone: "13900004444",
      email: "host2@yuelin.com",
      passwordHash: hash,
      nickname: "赵师傅",
      role: "HOST",
    },
  });
  console.log(`  ✓ Host (life) created: ${hostLife.nickname} (role: ${hostLife.role})`);

  console.log("\n✅ Seeding complete!");
  console.log("  Admin:   admin@yuelin.com   / 888888");
  console.log("  Teacher: teacher@yuelin.com / 888888");
  console.log("  Parent:  parent@yuelin.com  / 888888");
  console.log("  Host(Art):  host@yuelin.com   / 888888");
  console.log("  Host(Life): host2@yuelin.com  / 888888");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
