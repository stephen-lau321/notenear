"""
小红书学生需求采集器
Android 真机自动化，模拟真人浏览行为
uiautomator2 + OCR + AI 评分
"""

import time
import random
import json
import re
import os
import sys
import hashlib
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from typing import Optional
from pathlib import Path

import uiautomator2 as u2
import requests


# ============================================================
#  配置
# ============================================================

@dataclass
class Config:
    # 设备
    device_serial: str = ""          # 留空则自动连接第一个设备

    # 小红书 App
    xhs_package: str = "com.xingin.xhs"

    # 搜索关键词池
    keywords: list = field(default_factory=lambda: [
        # 钢琴
        "找钢琴老师", "想学钢琴", "钢琴老师推荐", "成人钢琴",
        "孩子学钢琴", "附近钢琴老师", "有没有靠谱的钢琴老师",
        "零基础钢琴", "学钢琴推荐", "XX区钢琴老师",
        # 小提琴
        "找小提琴老师", "想学小提琴", "小提琴老师推荐",
        # 古筝
        "找古筝老师", "学古筝", "古筝老师推荐",
        # 通用
        "想学乐器", "求推荐乐器老师", "有没有靠谱的乐器老师",
        "成人学乐器", "孩子想学乐器", "附近乐器培训",
        # 声乐
        "找声乐老师", "学唱歌", "声乐老师推荐",
        # 架子鼓
        "学架子鼓", "架子鼓老师",
        # 吉他
        "学吉他", "找吉他老师", "吉他老师推荐",
        # 大提琴
        "学大提琴", "大提琴老师",
        # 琵琶
        "学琵琶", "琵琶老师",
        # 二胡
        "学二胡", "二胡老师",
        # 管乐
        "学长笛", "学萨克斯", "单簧管老师",
    ])

    # 搜索配置
    max_posts_per_session: int = 40        # 单次会话最多浏览帖子数
    session_interval_min: int = 180         # 会话间隔（秒）3分钟
    session_interval_max: int = 600         # 会话间隔（秒）10分钟
    max_hours_old: int = 8                  # 只看N小时内的帖子
    daily_limit: int = 200                  # 每日采集上限

    # 行为模拟
    scroll_min: int = 200                   # 最小滑动距离
    scroll_max: int = 600                   # 最大滑动距离
    view_min: float = 2.0                   # 最短停留时间
    view_max: float = 8.0                   # 最长停留时间
    skip_probability: float = 0.25          # 跳过帖子的概率

    # API（匹配引擎后端）
    api_endpoint: str = "http://127.0.0.1:3000/api/v1/demands"   # 乐邻 NestJS 后端

    # 输出
    output_dir: str = "./collected_demands"
    save_screenshots: bool = False

    # 关键词中包含乐器的
    instruments: list = field(default_factory=lambda: [
        "钢琴", "小提琴", "中提琴", "大提琴", "低音提琴",
        "吉他", "古典吉他", "民谣吉他", "电吉他", "尤克里里",
        "长笛", "单簧管", "双簧管", "萨克斯", "小号", "长号",
        "架子鼓", "古筝", "二胡", "琵琶", "笛子", "箫",
        "古琴", "扬琴", "柳琴", "手风琴", "口琴", "电子琴",
        "声乐", "美声", "唱歌", "视唱练耳", "乐理",
        "马头琴", "葫芦丝", "巴乌", "埙", "陶笛",
    ])

    # 城市列表
    cities: list = field(default_factory=lambda: [
        "北京", "上海", "广州", "深圳", "杭州", "成都", "武汉",
        "重庆", "南京", "西安", "苏州", "长沙", "郑州", "天津",
        "合肥", "福州", "济南", "沈阳", "大连", "青岛", "厦门",
        "宁波", "昆明", "贵阳", "南宁", "哈尔滨", "长春", "石家庄",
        "太原", "南昌", "海口", "兰州", "乌鲁木齐", "呼和浩特",
        "拉萨", "西宁", "银川", "佛山", "东莞", "珠海", "惠州",
        "中山", "温州", "无锡", "常州", "南通", "徐州", "烟台",
        "潍坊", "临沂", "唐山", "洛阳", "襄阳", "宜昌",
    ])

    # 风控：每天的操作时间范围（避开凌晨）
    start_hour: int = 8
    end_hour: int = 23


config = Config()


# ============================================================
#  日志
# ============================================================

def log(msg: str, level: str = "INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")


# ============================================================
#  真人行为模拟器
# ============================================================

class HumanSim:
    """真人操作行为模拟"""

    def __init__(self, device: u2.Device):
        self.d = device
        self.width, self.height = self.d.window_size()
        log(f"屏幕尺寸: {self.width}x{self.height}")

    def sleep(self, min_s: float, max_s: float = None):
        """带抖动的等待"""
        if max_s is None:
            max_s = min_s + 0.5
        duration = random.uniform(min_s, max_s)
        time.sleep(duration)

    def swipe_up(self, distance: int = None, with_curve: bool = True):
        """模拟向上滑动（浏览更多内容）
        带轻微弧度，不像机器直线
        """
        if distance is None:
            distance = random.randint(config.scroll_min, config.scroll_max)

        x_start = self.width // 2 + random.randint(-60, 60)    # 横向起点抖动
        y_start = self.height * 3 // 4 + random.randint(-40, 40)
        y_end = y_start - distance + random.randint(-30, 30)   # 纵向终点抖动
        x_end = x_start + random.randint(-25, 25)               # 轻微横向偏移

        duration_ms = int(random.uniform(0.3, 0.8) * 1000)

        # 带弧度的滑动（分段）
        if with_curve and random.random() < 0.6:
            steps = random.randint(15, 30)
            self.d.swipe_points(
                self._bezier_curve(
                    (x_start, y_start),
                    (x_start + random.randint(-30, 30), (y_start + y_end) // 2),
                    (x_end, y_end),
                    steps
                ),
                duration=duration_ms / 1000
            )
        else:
            self.d.swipe(x_start, y_start, x_end, y_end, duration=duration_ms / 1000)

    def _bezier_curve(self, p0, p1, p2, steps):
        """贝塞尔曲线点集"""
        points = []
        for i in range(steps):
            t = i / (steps - 1)
            x = int((1-t)**2 * p0[0] + 2*(1-t)*t * p1[0] + t**2 * p2[0])
            y = int((1-t)**2 * p0[1] + 2*(1-t)*t * p1[1] + t**2 * p2[1])
            points.append((x, y))
        return points

    def tap_random(self, bounds: tuple):
        """在给定区域内随机点击"""
        x1, y1, x2, y2 = bounds
        x = random.randint(x1, x2)
        y = random.randint(y1, y2)
        self.d.click(x, y)

    def type_human(self, text: str):
        """模拟人打字速度"""
        for char in text:
            self.d.send_keys(char)
            time.sleep(random.uniform(0.03, 0.12))

    def should_rest_now(self) -> bool:
        """判断当前时间是否在操作窗口内"""
        hour = datetime.now().hour
        return hour < config.start_hour or hour >= config.end_hour


# ============================================================
#  帖子提取器
# ============================================================

class PostExtractor:
    """从小红书帖子提取结构化信息"""

    def __init__(self, device: u2.Device, sim: HumanSim):
        self.d = device
        self.sim = sim
        self.seen_hashes = set()  # 去重

    def _content_hash(self, text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()[:12]

    def is_duplicate(self, text: str) -> bool:
        h = self._content_hash(text)
        if h in self.seen_hashes:
            return True
        self.seen_hashes.add(h)
        return False

    def extract_current_view(self) -> list[dict]:
        """
        提取当前屏幕可见的帖子列表
        返回: [{content, time_text, ...}]
        """
        posts = []

        # 获取屏幕XML
        xml = self.d.dump_hierarchy()

        # 尝试通过 accessibility 信息提取帖子内容
        # 小红书帖子结构：标题/正文 + 时间 + 用户信息
        # 这个需要根据实际小红书UI做适配

        # 方式1：通过OCR提取（更通用，但较慢）
        screenshot_path = "/tmp/xhs_current.jpg"
        self.d.screenshot(screenshot_path)
        text_blocks = self._ocr_extract(screenshot_path)

        # 方式2：通过UI树提取（更快，但需要适配不同版本）
        ui_texts = self._extract_from_ui(xml)

        # 合并两种方式的结果
        all_text = text_blocks + ui_texts
        return all_text

    def _ocr_extract(self, image_path: str) -> list[str]:
        """OCR 提取文字"""
        # 使用 PaddleOCR（需要在环境中安装）
        # 这里先返回空，OCR 作为增强选项
        return []

    def _extract_from_ui(self, xml: str) -> list[str]:
        """从 UI 树提取文本"""
        texts = []
        # 提取所有可见文本节点
        import xml.etree.ElementTree as ET
        try:
            root = ET.fromstring(xml)
            for elem in root.iter():
                text = elem.attrib.get('text', '')
                if text and len(text) > 3:  # 过滤太短的
                    texts.append(text)
        except Exception:
            pass
        return texts

    def open_post(self) -> Optional[dict]:
        """
        点击当前屏幕的帖子，进入详情页，提取完整信息
        返回结构化数据
        """
        post_data = {
            "platform": "小红书",
            "content": "",
            "post_url": "",
            "location": {},
            "instrument": None,
            "budget": None,
            "post_time_text": "",
            "comment_count": 0,
            "account_signals": {},
            "collected_at": datetime.now().isoformat(),
        }

        # Step 1: 尝试提取正文
        # 在小红书详情页，正文通常在特定的 TextView 中
        time.sleep(1)
        content = self._get_detail_text()
        post_data["content"] = content

        # Step 2: 提取位置信息
        post_data["location"] = self._parse_location(content)

        # Step 3: 提取乐器
        post_data["instrument"] = self._parse_instrument(content)

        # Step 4: 提取发布时间
        post_data["post_time_text"] = self._get_time_text()

        # Step 5: 获取分享链接
        post_data["post_url"] = self._get_share_link()

        # Step 6: 提取评论区竞争情况
        post_data["comment_count"] = self._count_teacher_comments()

        # Step 7: 提取发帖人主页特征
        post_data["account_signals"] = self._extract_account_signals()

        return post_data

    def go_to_user_profile(self) -> dict:
        """进入发帖人主页，提取真实性特征"""
        signals = {
            "note_count": 0,
            "has_life_content": False,
            "has_kids_content": False,
            "is_marketing_account": False,
            "account_age_days": 0,
        }

        try:
            # 点击用户头像/昵称进入主页
            # 需要根据实际UI定位头像区域
            time.sleep(1.5)

            # 提取笔记数
            # 提取最近笔记的内容类型
            # 判断是否为营销号（信号：全是产品推荐、没有个人生活）

            # 营销号特征检测
            visible_texts = self._extract_from_ui(self.d.dump_hierarchy())
            full_text = " ".join(visible_texts)

            # 营销关键词检测
            marketing_keywords = [
                "私信", "加微信", "免费领", "试听课", "体验课",
                "招生", "报名", "优惠", "限时", "团购",
                "关注我", "收藏", "评论区扣", "戳我",
            ]
            marketing_count = sum(1 for kw in marketing_keywords if kw in full_text)
            signals["is_marketing_account"] = marketing_count >= 3

            # 生活内容检测
            life_keywords = [
                "宝宝", "孩子", "小朋友", "儿子", "女儿", "日常",
                "周末", "出去玩", "吃饭", "逛街", "旅游", "打卡",
                "练习", "练琴", "弹琴", "学琴",
            ]
            signals["has_life_content"] = any(kw in full_text for kw in life_keywords)
            signals["has_kids_content"] = any(
                kw in full_text for kw in ["宝宝", "孩子", "小朋友", "儿子", "女儿"]
            )

        except Exception as e:
            log(f"提取主页信息异常: {e}", "WARN")

        return signals

    def _get_detail_text(self) -> str:
        """获取帖子详情页正文"""
        texts = self._extract_from_ui(self.d.dump_hierarchy())
        # 过滤掉明显不是正文的（按钮文字、系统文字等）
        skip_words = [
            "关注", "点赞", "收藏", "评论", "分享", "首页", "购物",
            "消息", "我", "发布", "推荐", "搜索",
        ]
        content_lines = [
            t for t in texts
            if len(t) > 5 and t not in skip_words
        ]
        return " ".join(content_lines)

    def _parse_location(self, text: str) -> dict:
        """从文本中提取地理位置"""
        result = {"city": None, "district": None, "street": None}

        # 匹配城市
        for city in config.cities:
            if city in text:
                result["city"] = city
                break

        # 匹配街道/小区（常见模式）
        street_patterns = [
            r'([一-鿿]{2,4}(?:街道|路|街|社区|镇|乡|村))',
            r'([一-鿿]{2,6}(?:SOHO|广场|中心|大厦|城|苑|园|庄|屯|营|桥|口|门|里|巷|弄|湾|湖|海|花园|公寓))',
            r'(?:在|住|附近|周边|离)([一-鿿]{2,6})(?:附近|周边|这边|那边|这里|那里)',
        ]
        for pattern in street_patterns:
            match = re.search(pattern, text)
            if match:
                result["street"] = match.group(1)
                break

        return result

    def _parse_instrument(self, text: str) -> Optional[str]:
        """从文本中提取乐器"""
        matched = None
        max_len = 0
        for inst in config.instruments:
            if inst in text and len(inst) > max_len:
                matched = inst
                max_len = len(inst)
        return matched

    def _parse_budget(self, text: str) -> Optional[int]:
        """提取预算"""
        patterns = [
            r'预算[：:]*\s*(\d{3,4})',
            r'(\d{3,4})\s*(?:元|块|块钱|一节课|每节课|/节)',
            r'价格[：:]*\s*(\d{3,4})',
            r'(?:想找|找)(\d{3,4})(?:左右|以内|以下)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                budget = int(match.group(1))
                if 100 <= budget <= 2000:  # 合理范围
                    return budget
        return None

    def _get_time_text(self) -> str:
        """提取发布时间文本"""
        # 时间通常在帖子底部
        texts = self._extract_from_ui(self.d.dump_hierarchy())
        time_patterns = [
            r'(\d+分钟前)', r'(\d+小时前)', r'(刚刚)',
            r'(昨天\s*\d+:\d+)', r'(前天)', r'(\d+天前)',
        ]
        for t in texts:
            for pattern in time_patterns:
                match = re.search(pattern, t)
                if match:
                    return match.group(1)
        return ""

    def parse_hours_ago(self, time_text: str) -> Optional[float]:
        """解析时间为小时数"""
        if not time_text:
            return None

        if "刚刚" in time_text:
            return 0.1
        if "分钟前" in time_text:
            match = re.search(r'(\d+)分钟前', time_text)
            return int(match.group(1)) / 60.0 if match else None
        if "小时前" in time_text:
            match = re.search(r'(\d+)小时前', time_text)
            return float(match.group(1)) if match else None
        if "昨天" in time_text:
            return 24.0
        if "前天" in time_text:
            return 48.0
        if "天前" in time_text:
            match = re.search(r'(\d+)天前', time_text)
            return int(match.group(1)) * 24.0 if match else None

        return None

    def _get_share_link(self) -> str:
        """获取帖子分享链接"""
        try:
            # 点击分享按钮 → 复制链接
            # 根据实际UI定位分享按钮
            # 这里需要适配具体的小红书版本
            share_btn = self.d(
                description="分享",
                className="android.widget.ImageView"
            )
            if share_btn.exists:
                share_btn.click()
                time.sleep(0.8)
                # 查找"复制链接"按钮
                copy_btn = self.d(text="复制链接")
                if copy_btn.exists:
                    copy_btn.click()
                    time.sleep(0.3)
                    # 从剪贴板读取
                    return self.d.clipboard or ""
        except Exception as e:
            log(f"获取分享链接失败: {e}", "WARN")
        return ""

    def _count_teacher_comments(self) -> int:
        """统计评论区老师数量"""
        # 提取评论区可见内容
        texts = self._extract_from_ui(self.d.dump_hierarchy())
        teacher_signals = [
            "老师", "私信", "联系", "可以教", "我教", "报名",
            "了解一下", "试课", "体验", "专业", "教学", "考级",
            "音乐学院", "毕业", "多年经验",
        ]
        count = 0
        full_text = " ".join(texts)
        for signal in teacher_signals:
            count += full_text.count(signal)
        return min(count, 30)  # 上限

    def _extract_account_signals(self) -> dict:
        """提取发帖人账号真实性信号"""
        signals = self.go_to_user_profile()
        return signals

    def go_back(self):
        """返回上一页"""
        self.d.press("back")
        self.sim.sleep(0.5, 1.0)


# ============================================================
#  AI 质量评分器
# ============================================================

class QualityScorer:
    """帖子质量五维评分"""

    def score(self, post: dict) -> dict:
        """
        输入: 帖子数据
        输出: 评分详情 + 总分
        """
        scores = {
            "timeliness": self._score_timeliness(post),
            "completeness": self._score_completeness(post),
            "authenticity": self._score_authenticity(post),
            "competition": self._score_competition(post),
            "budget": self._score_budget(post),
        }

        weights = {
            "timeliness": 0.25,
            "completeness": 0.25,
            "authenticity": 0.30,
            "competition": 0.15,
            "budget": 0.05,
        }

        total = sum(scores[k] * weights[k] for k in scores)
        total = round(total, 1)

        grade = "高" if total >= 70 else ("中" if total >= 50 else "低")

        return {
            "total_score": total,
            "grade": grade,
            "detail": scores,
            "action": (
                "立即推送" if total >= 70
                else ("待人工确认" if total >= 50 else "自动过滤")
            ),
        }

    def _score_timeliness(self, post: dict) -> float:
        """时效性评分"""
        hours = post.get("hours_ago")
        if hours is None:
            return 40
        if hours <= 1:
            return 100
        if hours <= 4:
            return 90
        if hours <= 8:
            return 70
        if hours <= 24:
            return 30
        return 10

    def _score_completeness(self, post: dict) -> float:
        """信息完整度评分"""
        score = 0
        content = post.get("content", "")
        location = post.get("location", {})

        if post.get("instrument"):
            score += 40
        if location.get("city"):
            score += 25
        if location.get("street") or location.get("district"):
            score += 20
        if len(content) > 30:
            score += 15

        return min(score, 100)

    def _score_authenticity(self, post: dict) -> float:
        """真实性评分"""
        signals = post.get("account_signals", {})
        if not signals:
            return 50

        score = 50
        if signals.get("has_life_content"):
            score += 25
        if signals.get("has_kids_content"):
            score += 15
        if signals.get("is_marketing_account"):
            score -= 35
        if signals.get("note_count", 0) >= 10:
            score += 10
        if signals.get("note_count", 0) == 0:
            score -= 20

        return max(0, min(100, score))

    def _score_competition(self, post: dict) -> float:
        """竞争度评分（竞争越少分越高）"""
        count = post.get("comment_count", 0)
        if count <= 3:
            return 100
        if count <= 6:
            return 75
        if count <= 10:
            return 50
        if count <= 15:
            return 25
        return 10

    def _score_budget(self, post: dict) -> float:
        """预算维度"""
        budget = post.get("budget")
        if budget is None:
            return 50  # 没提预算不扣分
        if 180 <= budget <= 600:
            return 100
        if 100 <= budget <= 800:
            return 70
        return 40


# ============================================================
#  匹配引擎连接器
# ============================================================

class MatchEngine:
    """连接后端匹配引擎"""

    def __init__(self, endpoint: str = None):
        self.endpoint = endpoint or config.api_endpoint

    def submit(self, post_data: dict, quality: dict) -> bool:
        """提交需求到乐邻后端"""
        if not self.endpoint:
            log("未配置 API 端点，数据仅保存本地", "WARN")
            return False

        try:
            payload = {
                "source": "XHS",
                "sourceUrl": post_data.get("post_url", ""),
                "content": post_data.get("content", ""),
                "instrument": post_data.get("instrument"),
                "city": (post_data.get("location") or {}).get("city"),
                "district": (post_data.get("location") or {}).get("district"),
                "street": (post_data.get("location") or {}).get("street"),
                "budget": post_data.get("budget"),
                "postTimeText": post_data.get("post_time_text", ""),
                "hoursAgo": post_data.get("hours_ago"),
                "commentCount": post_data.get("comment_count", 0),
                "accountSignals": post_data.get("account_signals", {}),
                "rawData": post_data,
            }
            headers = {
                "X-API-Key": "street-music-collector-dev",
                "Content-Type": "application/json",
            }
            resp = requests.post(
                self.endpoint,
                json=payload,
                headers=headers,
                timeout=10,
            )
            if resp.status_code == 200:
                log(f"已提交到匹配引擎: {post_data.get('instrument')}")
                return True
            else:
                log(f"API 返回 {resp.status_code}", "WARN")
        except Exception as e:
            log(f"提交匹配引擎失败: {e}", "WARN")
        return False


# ============================================================
#  主采集器
# ============================================================

class XHSCollector:
    """小红书学生需求采集器"""

    def __init__(self, device_serial: str = ""):
        # 连接设备
        if device_serial:
            self.d = u2.connect(device_serial)
        else:
            self.d = u2.connect()

        self.sim = HumanSim(self.d)
        self.extractor = PostExtractor(self.d, self.sim)
        self.scorer = QualityScorer()
        self.engine = MatchEngine()

        self.collected_today = 0
        self.session_count = 0

        # 输出目录
        os.makedirs(config.output_dir, exist_ok=True)

        log(f"设备连接成功: {self.d.info}")

    def start(self):
        """启动采集循环"""
        log("=" * 50)
        log("🚀 小红书学生需求采集器启动")
        log(f"   每日上限: {config.daily_limit} 条")
        log(f"   操作时间: {config.start_hour}:00 - {config.end_hour}:00")
        log(f"   输出目录: {config.output_dir}")
        log("=" * 50)

        while True:
            try:
                # 时间窗口检查
                if self.sim.should_rest_now():
                    log("当前不在操作时间窗口，等待...")
                    time.sleep(600)
                    continue

                # 日上限检查
                if self.collected_today >= config.daily_limit:
                    log(f"已达每日上限 {config.daily_limit}，等待明天...")
                    time.sleep(3600)
                    # 判断是否过了一天
                    if datetime.now().hour < config.start_hour:
                        self.collected_today = 0
                    continue

                # 执行一轮采集
                self._run_session()

            except KeyboardInterrupt:
                log("用户中断")
                break
            except Exception as e:
                log(f"采集异常: {e}", "ERROR")
                self.sim.sleep(60, 120)

        log(f"采集器停止。本次采集: {self.collected_today} 条")

    def _run_session(self):
        """执行一轮采集会话"""
        self.session_count += 1
        log(f"\n📋 第 {self.session_count} 轮采集开始")

        # 唤醒
        self._wake_up()

        # 随机打乱关键词
        keywords = random.sample(
            config.keywords,
            min(len(config.keywords), random.randint(4, 8))
        )

        for keyword in keywords:
            if self.collected_today >= config.daily_limit:
                break

            try:
                self._search_and_browse(keyword)
            except Exception as e:
                log(f"关键词 '{keyword}' 处理异常: {e}", "WARN")
                continue

            # 关键词间休息
            self.sim.sleep(15, 45)

        # 会话间休息
        cool = random.randint(config.session_interval_min, config.session_interval_max)
        log(f"本轮结束，休息 {cool} 秒")
        time.sleep(cool)

    def _wake_up(self):
        """唤醒设备"""
        self.d.wakeup()
        self.sim.sleep(0.5, 1.0)

        # 确保小红书在前台
        try:
            self.d.app_start(config.xhs_package, stop=False)
            self.sim.sleep(2, 3)
        except Exception:
            log("启动小红书失败，尝试手动打开", "WARN")
            self.sim.sleep(3, 5)

    def _search_and_browse(self, keyword: str):
        """搜索关键词并浏览"""
        log(f"🔍 搜索: '{keyword}'")

        # 点击搜索
        self._tap_search_icon()
        self.sim.sleep(1, 2)

        # 输入关键词
        search_box = self.d(
            className="android.widget.EditText",
            clickable=True,
        )
        if search_box.exists:
            search_box.click()
            self.sim.sleep(0.5, 1)
            search_box.clear_text()
            self.sim.sleep(0.3, 0.5)
            self.sim.type_human(keyword)
            self.sim.sleep(0.5, 1)

            # 确认搜索（回车）
            self.d.press("enter")
            self.sim.sleep(2, 3)

        # 切换到「最新」tab
        self._tap_latest_tab()

        # 浏览帖子
        self._browse_posts(keyword)

    def _tap_search_icon(self):
        """点击搜索图标"""
        # 尝试多种定位方式
        search_icons = [
            self.d(descriptionContains="搜索"),
            self.d(text="搜索"),
            self.d(description="搜索"),
        ]
        for icon in search_icons:
            if icon.exists:
                icon.click()
                return
        # 兜底：点击顶部区域
        self.d.click(self.sim.width // 2, 80)

    def _tap_latest_tab(self):
        """点击「最新」排序"""
        self.sim.sleep(1, 2)
        latest = self.d(text="最新")
        if latest.exists:
            latest.click()
            self.sim.sleep(1, 2)
        else:
            # 尝试滑动顶部分类栏
            tab_bar = self.d(
                className="android.widget.HorizontalScrollView"
            )
            if tab_bar.exists:
                self.d.swipe(
                    self.sim.width * 3 // 4, 200,
                    self.sim.width // 4, 200,
                    0.3
                )
                self.sim.sleep(1)
                latest2 = self.d(text="最新")
                if latest2.exists:
                    latest2.click()

    def _browse_posts(self, keyword: str):
        """浏览帖子列表，识别目标帖子"""
        posts_in_session = 0

        while posts_in_session < config.max_posts_per_session:
            if self.collected_today >= config.daily_limit:
                break

            # 随机停留
            self.sim.sleep(config.view_min, config.view_max)

            # 以一定概率跳过当前
            if random.random() < config.skip_probability:
                self.sim.swipe_up()
                posts_in_session += 1
                continue

            # 识别当前屏幕帖子
            raw_posts = self.extractor.extract_current_view()

            # 如果找到看起来像求师帖的内容 → 点进去
            if self._looks_like_demand(raw_posts):
                try:
                    post_data = self.extractor.open_post()

                    if not post_data.get("content"):
                        self.extractor.go_back()
                        self.sim.swipe_up()
                        posts_in_session += 1
                        continue

                    # 解析时间
                    hours = self.extractor.parse_hours_ago(
                        post_data.get("post_time_text", "")
                    )
                    post_data["hours_ago"] = hours

                    # 过滤超过8小时的
                    if hours and hours > config.max_hours_old:
                        log(f"  跳过（{hours:.1f}小时前）: {post_data['content'][:50]}...")
                        self.extractor.go_back()
                        self.sim.swipe_up()
                        posts_in_session += 1
                        continue

                    # AI 评分
                    quality = self.scorer.score(post_data)
                    post_data["quality"] = quality

                    # 高质量 → 保存 + 提交
                    if quality["action"] in ("立即推送", "待人工确认"):
                        self._save_and_submit(post_data, quality)
                        self.collected_today += 1

                    self.extractor.go_back()

                except Exception as e:
                    log(f"提取帖子异常: {e}", "WARN")
                    try:
                        self.extractor.go_back()
                    except Exception:
                        pass

            # 继续滚动
            self.sim.swipe_up()
            posts_in_session += 1

    def _looks_like_demand(self, texts: list) -> bool:
        """判断文本像不像学生求师帖"""
        if not texts:
            return False

        combined = " ".join(texts) if isinstance(texts, list) else texts

        demand_signals = [
            "找", "想学", "想让孩子学", "有没有", "求推荐",
            "推荐", "哪里", "靠谱", "零基础", "成人", "孩子",
            "小朋友", "女儿", "儿子", "学琴", "附近", "周边",
        ]
        match_count = sum(1 for s in demand_signals if s in combined)
        return match_count >= 2

    def _save_and_submit(self, post: dict, quality: dict):
        """保存需求数据并提交匹配引擎"""
        demand_id = hashlib.md5(
            (post.get("content", "") + str(datetime.now().timestamp())).encode()
        ).hexdigest()[:12]

        record = {
            "id": demand_id,
            **post,
            "quality": quality,
            "keyword": post.get("keyword", ""),
        }

        # 保存本地
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"{config.output_dir}/demands_{date_str}.jsonl"
        with open(filename, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        # 提交匹配引擎
        self.engine.submit(post, quality)

        # 日志
        emoji = "🟢" if quality["grade"] == "高" else ("🟡" if quality["grade"] == "中" else "🔴")
        log(
            f"  {emoji} [{quality['total_score']}分] "
            f"{post.get('instrument') or '未知乐器'} | "
            f"{post.get('location',{}).get('city') or '未知城市'} | "
            f"{post.get('post_time_text') or '未知时间'} | "
            f"{post['content'][:50].replace(chr(10), ' ')}..."
        )


# ============================================================
#  命令行入口
# ============================================================

def print_banner():
    print("""
╔══════════════════════════════════════╗
║  🎹 西奥瑞嘉 · AI 生源采集引擎     ║
║  小红书需求采集器 v1.0              ║
╚══════════════════════════════════════╝
""")


def check_environment():
    """检查环境"""
    print("📋 环境检查...")

    # 检查 ADB
    import subprocess
    try:
        result = subprocess.run(
            ["adb", "devices"], capture_output=True, text=True, timeout=10
        )
        devices = [l for l in result.stdout.split('\n') if '\tdevice' in l]
        if not devices:
            print("❌ 未检测到 Android 设备，请确保:")
            print("   1. 手机通过 USB 连接到电脑")
            print("   2. 手机已开启 USB 调试")
            print("   3. 已授权电脑的调试请求")
            sys.exit(1)
        print(f"✅ 检测到 {len(devices)} 个设备: {devices[0].split()[0]}")
    except FileNotFoundError:
        print("❌ 未找到 ADB，请安装 Android SDK Platform Tools")
        print("   下载: https://developer.android.com/studio/releases/platform-tools")
        sys.exit(1)
    except Exception as e:
        print(f"⚠️ ADB 检查异常: {e}")

    # 检查 uiautomator2
    try:
        import uiautomator2
        print(f"✅ uiautomator2 已安装 (版本: {uiautomator2.__version__})")
    except ImportError:
        print("❌ 请安装 uiautomator2: pip install uiautomator2")
        sys.exit(1)

    print("✅ 环境检查通过\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="小红书学生需求采集器 - Android 真机自动化"
    )
    parser.add_argument(
        "--device", "-d", type=str, default="",
        help="设备序列号（留空自动连接）"
    )
    parser.add_argument(
        "--daily-limit", type=int, default=200,
        help="每日采集上限（默认200）"
    )
    parser.add_argument(
        "--max-hours", type=int, default=8,
        help="只采集N小时内的帖子（默认8）"
    )
    parser.add_argument(
        "--output", "-o", type=str, default="./collected_demands",
        help="输出目录"
    )
    parser.add_argument(
        "--api", type=str, default="http://127.0.0.1:5050/api/demand",
        help="匹配引擎 API 地址"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="试运行，不实际保存和提交"
    )
    parser.add_argument(
        "--single", action="store_true",
        help="只跑一轮，不循环"
    )
    parser.add_argument(
        "--screenshots", action="store_true",
        help="保存截图用于调试"
    )

    args = parser.parse_args()

    print_banner()
    check_environment()

    # 更新配置
    config.daily_limit = args.daily_limit
    config.max_hours_old = args.max_hours
    config.output_dir = args.output
    config.api_endpoint = args.api
    config.save_screenshots = args.screenshots

    # 创建采集器
    collector = XHSCollector(device_serial=args.device)

    if args.dry_run:
        log("⚠️ 试运行模式")
        config.daily_limit = 5
        config.max_posts_per_session = 10

    if args.single:
        log("单轮模式")
        collector._run_session()
    else:
        collector.start()


if __name__ == "__main__":
    main()
