# py 3.12.5
import requests
import json
from pydantic import BaseModel
from typing import Dict
import time


class Config(BaseModel):
    COOLDOWN_TIME: int = 1  # 冷却时间（秒）
    API_URL: str = "https://mbmodule-openapi.paas.cmbchina.com/product/v1/func/market-center"
    API_HEADERS: dict = {
        'Host': 'mbmodule-openapi.paas.cmbchina.com',
        'Connection': 'keep-alive',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Android WebView";v="128"',
        'Accept': 'application/json, text/plain, */*',
        'sec-ch-ua-platform': 'Android',
        'sec-ch-ua-mobile': '?1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0',
        'Origin': 'https://mbmodulecdn.cmbimg.com',
        'X-Requested-With': 'cmb.pb',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://mbmodulecdn.cmbimg.com/',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    API_PAYLOAD: str = 'params=[{"prdType":"H","prdCode":""}]'


def fetch_gold_price(config: Config = None) -> Dict:
    """
    获取金价数据
    
    Returns:
        Dict: 返回金价数据，格式如下：
        {
            "success": True/False,
            "data": {...},
            "error": "错误信息"
        }
    """
    if config is None:
        config = Config()
    
    try:
        print(f"🌐 正在请求金价数据...")
        print(f"📍 API URL: {config.API_URL}")
        print(f"📦 Payload: {config.API_PAYLOAD}")
        
        response = requests.post(
            config.API_URL,
            headers=config.API_HEADERS,
            data=config.API_PAYLOAD,
            timeout=10
        )
        
        print(f"✅ HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 响应数据:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            return {
                "success": True,
                "data": data,
                "error": None
            }
        else:
            error_msg = f"HTTP错误: {response.status_code}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "data": None,
                "error": error_msg
            }
            
    except requests.exceptions.Timeout:
        error_msg = "请求超时"
        print(f"⏱️ {error_msg}")
        return {
            "success": False,
            "data": None,
            "error": error_msg
        }
    except requests.exceptions.RequestException as e:
        error_msg = f"请求异常: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "data": None,
            "error": error_msg
        }
    except json.JSONDecodeError as e:
        error_msg = f"JSON解析失败: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "data": None,
            "error": error_msg
        }


def continuous_fetch(config: Config = None, count: int = 5):
    """
    持续获取金价数据
    
    Args:
        config: 配置对象
        count: 获取次数
    """
    if config is None:
        config = Config()
    
    print(f"\n🚀 开始持续获取金价数据 (共{count}次，间隔{config.COOLDOWN_TIME}秒)")
    print("=" * 60)
    
    for i in range(count):
        print(f"\n📍 第 {i+1}/{count} 次请求")
        print("-" * 60)
        
        result = fetch_gold_price(config)
        
        if result["success"]:
            print(f"✅ 第 {i+1} 次请求成功")
        else:
            print(f"❌ 第 {i+1} 次请求失败: {result['error']}")
        
        if i < count - 1:  # 最后一次不需要等待
            print(f"\n⏳ 等待 {config.COOLDOWN_TIME} 秒...")
            time.sleep(config.COOLDOWN_TIME)
    
    print("\n" + "=" * 60)
    print(f"🎉 完成！共请求 {count} 次")


if __name__ == "__main__":
    # 方式1: 单次请求
    print("=" * 60)
    print("🧪 测试单次请求")
    print("=" * 60)
    result = fetch_gold_price()
    
    if result["success"]:
        print("\n✅ 请求成功！")
        print(f"📊 数据: {json.dumps(result['data'], indent=2, ensure_ascii=False)}")
    else:
        print(f"\n❌ 请求失败: {result['error']}")
    
    # 方式2: 持续请求（取消注释以启用）
    # print("\n\n")
    # continuous_fetch(count=3)
