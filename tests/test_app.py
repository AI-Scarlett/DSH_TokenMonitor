import json,re,unittest
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class AppParser(HTMLParser):
 def __init__(self): super().__init__(); self.ids=set(); self.scripts=[]; self.links=[]
 def handle_starttag(self,tag,attrs):
  data=dict(attrs)
  if 'id' in data: self.ids.add(data['id'])
  if tag=='script' and data.get('src'): self.scripts.append(data['src'])
  if tag=='link' and data.get('href'): self.links.append(data['href'])
class TokenMonitorTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.html=(ROOT/'index.html').read_text(); cls.js=(ROOT/'app.js').read_text(); cls.css=(ROOT/'styles.css').read_text(); cls.parser=AppParser(); cls.parser.feed(cls.html)
 def test_required_files_exist(self):
  for path in ['index.html','styles.css','app.js','assets/favicon.svg','scripts/build.py','package.json']: self.assertTrue((ROOT/path).is_file(),path)
 def test_document_is_accessible_and_complete(self):
  self.assertIn('lang="zh-CN"',self.html); self.assertIn('aria-label',self.html); self.assertIn('meta name="viewport"',self.html)
  for ident in ['metricGrid','usageChart','recentTable','requestTable','modelCards','usageModal','budgetForm']: self.assertIn(ident,self.parser.ids)
 def test_asset_references_resolve(self):
  for asset in self.parser.scripts+self.parser.links:
   if not asset.startswith(('http:','https:')): self.assertTrue((ROOT/asset).exists(),asset)
 def test_javascript_has_core_features(self):
  for feature in ['localStorage','renderChart','renderRequests','renderModels','JSON.stringify','Blob','FormData']: self.assertIn(feature,self.js)
  self.assertGreaterEqual(self.js.count('addEventListener'),10)
 def test_seed_data_has_multiple_models(self):
  models=set(re.findall(r"model:'([^']+)'",self.js)); self.assertGreaterEqual(len(models),5)
 def test_css_is_responsive(self):
  self.assertIn('@media(max-width:760px)',self.css); self.assertIn('grid-template-columns',self.css); self.assertIn(':root',self.css)
 def test_package_metadata(self):
  package=json.loads((ROOT/'package.json').read_text()); self.assertEqual(package['name'],'dsh-token-monitor'); self.assertIn('build',package['scripts']); self.assertIn('test',package['scripts'])
if __name__=='__main__': unittest.main()
