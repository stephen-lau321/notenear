// China administrative divisions: Province to City to District
// Includes all 34 provincial-level divisions

export interface AreaCity {
  name: string;
  districts: string[];
}

export interface AreaProvince {
  name: string;
  cities: AreaCity[];
}

export const chinaAreas: AreaProvince[] = [
  { name: "北京市", cities: [{ name: "北京市", districts: ["东城区","西城区","朝阳区","海淀区","丰台区","石景山区","通州区","大兴区","昌平区","顺义区","房山区","门头沟区","怀柔区","平谷区","密云区","延庆区"] }] },
  { name: "天津市", cities: [{ name: "天津市", districts: ["和平区","河东区","河西区","南开区","河北区","红桥区","滨海新区","东丽区","西青区","津南区","北辰区","武清区","宝坻区","宁河区","静海区","蓟州区"] }] },
  { name: "上海市", cities: [{ name: "上海市", districts: ["黄浦区","徐汇区","长宁区","静安区","普陀区","虹口区","杨浦区","浦东新区","闵行区","宝山区","嘉定区","金山区","松江区","青浦区","奉贤区","崇明区"] }] },
  { name: "重庆市", cities: [{ name: "重庆市", districts: ["渝中区","江北区","南岸区","沙坪坝区","九龙坡区","大渡口区","北碚区","渝北区","巴南区","万州区","涪陵区","永川区","合川区","江津区","长寿区","綦江区","大足区","璧山区","铜梁区","潼南区","荣昌区","开州区","梁平区","武隆区"] }] },
  { name: "河北省", cities: [{ name: "石家庄市", districts: ["长安区","桥西区","新华区","裕华区","井陉矿区","藁城区","鹿泉区","栾城区","正定县"] },{ name: "唐山市", districts: ["路南区","路北区","古冶区","开平区","丰南区","丰润区","曹妃甸区"] },{ name: "保定市", districts: ["竞秀区","莲池区","满城区","清苑区","徐水区"] },{ name: "邯郸市", districts: ["丛台区","邯山区","复兴区","峰峰矿区","肥乡区","永年区"] },{ name: "秦皇岛市", districts: ["海港区","山海关区","北戴河区","抚宁区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "山西省", cities: [{ name: "太原市", districts: ["小店区","迎泽区","杏花岭区","尖草坪区","万柏林区","晋源区"] },{ name: "大同市", districts: ["平城区","云冈区","新荣区","云州区"] },{ name: "晋中市", districts: ["榆次区","太谷区"] },{ name: "运城市", districts: ["盐湖区"] },{ name: "临汾市", districts: ["尧都区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "辽宁省", cities: [{ name: "沈阳市", districts: ["和平区","沈河区","大东区","皇姑区","铁西区","苏家屯区","浑南区","沈北新区","于洪区"] },{ name: "大连市", districts: ["中山区","西岗区","沙河口区","甘井子区","旅顺口区","金州区","普兰店区"] },{ name: "鞍山市", districts: ["铁东区","铁西区","立山区","千山区"] },{ name: "抚顺市", districts: ["新抚区","望花区","东洲区","顺城区"] },{ name: "锦州市", districts: ["古塔区","凌河区","太和区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "吉林省", cities: [{ name: "长春市", districts: ["南关区","宽城区","朝阳区","二道区","绿园区","双阳区","九台区"] },{ name: "吉林市", districts: ["昌邑区","龙潭区","船营区","丰满区"] },{ name: "四平市", districts: ["铁西区","铁东区"] },{ name: "延边朝鲜族自治州", districts: ["延吉市","珲春市"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "黑龙江省", cities: [{ name: "哈尔滨市", districts: ["道里区","南岗区","道外区","平房区","松北区","香坊区","呼兰区","阿城区","双城区"] },{ name: "齐齐哈尔市", districts: ["龙沙区","建华区","铁锋区","富拉尔基区"] },{ name: "牡丹江市", districts: ["东安区","阳明区","爱民区","西安区"] },{ name: "大庆市", districts: ["萨尔图区","龙凤区","让胡路区","红岗区","大同区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "江苏省", cities: [{ name: "南京市", districts: ["玄武区","秦淮区","建邺区","鼓楼区","浦口区","栖霞区","雨花台区","江宁区","六合区","溧水区","高淳区"] },{ name: "苏州市", districts: ["虎丘区","吴中区","相城区","姑苏区","吴江区","常熟市","张家港市","昆山市","太仓市"] },{ name: "无锡市", districts: ["锡山区","惠山区","滨湖区","梁溪区","新吴区"] },{ name: "常州市", districts: ["天宁区","钟楼区","新北区","武进区","金坛区"] },{ name: "南通市", districts: ["崇川区","通州区","海门区"] },{ name: "徐州市", districts: ["鼓楼区","云龙区","贾汪区","泉山区","铜山区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "浙江省", cities: [{ name: "杭州市", districts: ["上城区","拱墅区","西湖区","滨江区","萧山区","余杭区","临平区","钱塘区","富阳区","临安区"] },{ name: "宁波市", districts: ["海曙区","江北区","北仑区","镇海区","鄞州区","奉化区"] },{ name: "温州市", districts: ["鹿城区","龙湾区","瓯海区","洞头区"] },{ name: "嘉兴市", districts: ["南湖区","秀洲区"] },{ name: "绍兴市", districts: ["越城区","柯桥区","上虞区"] },{ name: "金华市", districts: ["婺城区","金东区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "安徽省", cities: [{ name: "合肥市", districts: ["瑶海区","庐阳区","蜀山区","包河区","巢湖市"] },{ name: "芜湖市", districts: ["镜湖区","弋江区","鸠江区","湾沚区","繁昌区"] },{ name: "蚌埠市", districts: ["龙子湖区","蚌山区","禹会区","淮上区"] },{ name: "马鞍山市", districts: ["花山区","雨山区","博望区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "福建省", cities: [{ name: "福州市", districts: ["鼓楼区","台江区","仓山区","马尾区","晋安区","长乐区"] },{ name: "厦门市", districts: ["思明区","海沧区","湖里区","集美区","同安区","翔安区"] },{ name: "泉州市", districts: ["鲤城区","丰泽区","洛江区","泉港区"] },{ name: "漳州市", districts: ["芗城区","龙文区","龙海区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "江西省", cities: [{ name: "南昌市", districts: ["东湖区","西湖区","青云谱区","青山湖区","新建区","红谷滩区"] },{ name: "九江市", districts: ["濂溪区","浔阳区","柴桑区"] },{ name: "赣州市", districts: ["章贡区","南康区","赣县区"] },{ name: "上饶市", districts: ["信州区","广丰区","广信区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "山东省", cities: [{ name: "济南市", districts: ["历下区","市中区","槐荫区","天桥区","历城区","长清区","章丘区","济阳区","莱芜区","钢城区"] },{ name: "青岛市", districts: ["市南区","市北区","黄岛区","崂山区","李沧区","城阳区","即墨区"] },{ name: "淄博市", districts: ["淄川区","张店区","博山区","临淄区","周村区"] },{ name: "烟台市", districts: ["芝罘区","福山区","牟平区","莱山区","蓬莱区"] },{ name: "潍坊市", districts: ["潍城区","寒亭区","坊子区","奎文区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "河南省", cities: [{ name: "郑州市", districts: ["中原区","二七区","管城回族区","金水区","上街区","惠济区","郑东新区"] },{ name: "洛阳市", districts: ["老城区","西工区","瀍河回族区","涧西区","洛龙区","孟津区","偃师区"] },{ name: "开封市", districts: ["龙亭区","顺河回族区","鼓楼区","禹王台区","祥符区"] },{ name: "新乡市", districts: ["红旗区","卫滨区","凤泉区","牧野区"] },{ name: "南阳市", districts: ["宛城区","卧龙区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "湖北省", cities: [{ name: "武汉市", districts: ["江岸区","江汉区","硚口区","汉阳区","武昌区","青山区","洪山区","东西湖区","汉南区","蔡甸区","江夏区","黄陂区","新洲区"] },{ name: "宜昌市", districts: ["西陵区","伍家岗区","点军区","猇亭区","夷陵区"] },{ name: "襄阳市", districts: ["襄城区","樊城区","襄州区"] },{ name: "荆州市", districts: ["沙市区","荆州区"] },{ name: "黄石市", districts: ["黄石港区","西塞山区","下陆区","铁山区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "湖南省", cities: [{ name: "长沙市", districts: ["芙蓉区","天心区","岳麓区","开福区","雨花区","望城区"] },{ name: "株洲市", districts: ["荷塘区","芦淞区","石峰区","天元区","渌口区"] },{ name: "湘潭市", districts: ["雨湖区","岳塘区"] },{ name: "衡阳市", districts: ["珠晖区","雁峰区","石鼓区","蒸湘区","南岳区"] },{ name: "岳阳市", districts: ["岳阳楼区","云溪区","君山区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "广东省", cities: [{ name: "广州市", districts: ["荔湾区","越秀区","海珠区","天河区","白云区","黄埔区","番禺区","花都区","南沙区","从化区","增城区"] },{ name: "深圳市", districts: ["罗湖区","福田区","南山区","宝安区","龙岗区","盐田区","龙华区","坪山区","光明区"] },{ name: "珠海市", districts: ["香洲区","斗门区","金湾区"] },{ name: "汕头市", districts: ["金平区","龙湖区","濠江区","潮阳区","潮南区","澄海区"] },{ name: "佛山市", districts: ["禅城区","南海区","顺德区","三水区","高明区"] },{ name: "东莞市", districts: ["莞城区","南城区","万江区","东城区"] },{ name: "中山市", districts: ["石岐区","东区","西区","南区"] },{ name: "惠州市", districts: ["惠城区","惠阳区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "海南省", cities: [{ name: "海口市", districts: ["秀英区","龙华区","琼山区","美兰区"] },{ name: "三亚市", districts: ["海棠区","吉阳区","天涯区","崖州区"] },{ name: "三沙市", districts: ["西沙区","南沙区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "四川省", cities: [{ name: "成都市", districts: ["锦江区","青羊区","金牛区","武侯区","成华区","龙泉驿区","青白江区","新都区","温江区","双流区","郫都区","新津区"] },{ name: "绵阳市", districts: ["涪城区","游仙区","安州区"] },{ name: "德阳市", districts: ["旌阳区","罗江区"] },{ name: "宜宾市", districts: ["翠屏区","南溪区","叙州区"] },{ name: "南充市", districts: ["顺庆区","高坪区","嘉陵区"] },{ name: "泸州市", districts: ["江阳区","纳溪区","龙马潭区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "贵州省", cities: [{ name: "贵阳市", districts: ["南明区","云岩区","花溪区","乌当区","白云区","观山湖区"] },{ name: "遵义市", districts: ["红花岗区","汇川区","播州区"] },{ name: "六盘水市", districts: ["钟山区","水城区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "云南省", cities: [{ name: "昆明市", districts: ["五华区","盘龙区","官渡区","西山区","东川区","呈贡区","晋宁区"] },{ name: "曲靖市", districts: ["麒麟区","沾益区","马龙区"] },{ name: "大理白族自治州", districts: ["大理市"] },{ name: "丽江市", districts: ["古城区","玉龙县"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "陕西省", cities: [{ name: "西安市", districts: ["新城区","碑林区","莲湖区","灞桥区","未央区","雁塔区","阎良区","临潼区","长安区","高陵区","鄠邑区"] },{ name: "咸阳市", districts: ["秦都区","渭城区","杨陵区"] },{ name: "宝鸡市", districts: ["渭滨区","金台区","陈仓区"] },{ name: "汉中市", districts: ["汉台区","南郑区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "甘肃省", cities: [{ name: "兰州市", districts: ["城关区","七里河区","西固区","安宁区","红古区"] },{ name: "天水市", districts: ["秦州区","麦积区"] },{ name: "酒泉市", districts: ["肃州区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "青海省", cities: [{ name: "西宁市", districts: ["城东区","城中区","城西区","城北区","湟中区"] },{ name: "海东市", districts: ["乐都区","平安区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "台湾省", cities: [{ name: "台北市", districts: ["中正区","大同区","中山区","万华区","信义区","松山区","大安区","士林区","北投区","内湖区","南港区","文山区"] },{ name: "高雄市", districts: ["盐埕区","鼓山区","左营区","楠梓区","三民区","新兴区","前金区","苓雅区","前镇区","旗津区","小港区"] },{ name: "台中市", districts: ["中区","东区","南区","西区","北区","北屯区","西屯区","南屯区"] },{ name: "台南市", districts: ["中西区","东区","南区","北区","安平区","安南区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "内蒙古自治区", cities: [{ name: "呼和浩特市", districts: ["新城区","回民区","玉泉区","赛罕区"] },{ name: "包头市", districts: ["东河区","昆都仑区","青山区","石拐区","白云鄂博矿区","九原区"] },{ name: "赤峰市", districts: ["红山区","元宝山区","松山区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "广西壮族自治区", cities: [{ name: "南宁市", districts: ["兴宁区","青秀区","江南区","西乡塘区","良庆区","邕宁区","武鸣区"] },{ name: "桂林市", districts: ["秀峰区","叠彩区","象山区","七星区","雁山区","临桂区"] },{ name: "柳州市", districts: ["城中区","鱼峰区","柳南区","柳北区","柳江区"] },{ name: "北海市", districts: ["海城区","银海区","铁山港区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "西藏自治区", cities: [{ name: "拉萨市", districts: ["城关区","堆龙德庆区","达孜区"] },{ name: "日喀则市", districts: ["桑珠孜区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "宁夏回族自治区", cities: [{ name: "银川市", districts: ["兴庆区","西夏区","金凤区","永宁县","贺兰县","灵武市"] },{ name: "石嘴山市", districts: ["大武口区","惠农区"] },{ name: "吴忠市", districts: ["利通区","红寺堡区"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "新疆维吾尔自治区", cities: [{ name: "乌鲁木齐市", districts: ["天山区","沙依巴克区","新市区","水磨沟区","头屯河区","达坂城区","米东区"] },{ name: "克拉玛依市", districts: ["独山子区","克拉玛依区","白碱滩区","乌尔禾区"] },{ name: "伊犁哈萨克自治州", districts: ["伊宁市","奎屯市","霍尔果斯市"] },{ name: "其他城市", districts: ["其他区"] }] },
  { name: "香港特别行政区", cities: [{ name: "香港岛", districts: ["中西区","湾仔区","东区","南区"] },{ name: "九龙", districts: ["油尖旺区","深水埗区","九龙城区","黄大仙区","观塘区"] },{ name: "新界", districts: ["葵青区","荃湾区","屯门区","元朗区","北区","大埔区","沙田区","西贡区","离岛区"] }] },
  { name: "澳门特别行政区", cities: [{ name: "澳门半岛", districts: ["花地玛堂区","圣安多尼堂区","大堂区","望德堂区","风顺堂区"] },{ name: "离岛", districts: ["嘉模堂区","圣方济各堂区","路氹城"] }] },
];

export function getProvinceNames(): string[] {
  return chinaAreas.map((p) => p.name);
}

export function getCitiesByProvince(province: string): string[] {
  const p = chinaAreas.find((a) => a.name === province);
  return p ? p.cities.map((c) => c.name) : [];
}

export function getDistrictsByCity(province: string, city: string): string[] {
  const p = chinaAreas.find((a) => a.name === province);
  if (!p) return [];
  const c2 = p.cities.find((c) => c.name === city);
  return c2 ? c2.districts : [];
}
