import json, re, sys
g4 = open("g4.html").read()
a0 = g4.index("(function () {")
a1 = g4.index("  // ---------------------------------------------------------------- input")
engine = g4[a0:a1]
engine = engine.replace("PANGOLIN RUSH 4  -  a hand-written WebGL 3D speed platformer", "PANGOLIN RUSH COLLECTION  -  Rush Island hub + all four games")
c0 = g4.index("  var CH = ["); c1 = g4.index("  ];", c0) + 5
chars = g4[c0:c1]
d0 = g4.index("  function drawChar(c, x, y, z, h, o) {"); d1 = g4.index("  function drawBeetle(e) {")
dc = g4[d0:d1].replace("var B = X(T(x, y, z), RY(h), RX(o.pitch || 0))", "var B = X(T(x, y, z), RY(h), RX(o.pitch || 0), S(o.sc || 1))")
assert "S(o.sc || 1)" in dc
hub = open("hub.js").read()
names = ["g1.html", "g2.html", "g3.html", "g4.html"]
games = []
for n in names:
    games.append(open(n).read())
def js_str(s):
    j = json.dumps(s)
    return j.replace("</", "<\\/").replace("<!--", "<\\!--").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
import gzip, base64, textwrap
gamejs = ""
blocks = ""
for i, g in enumerate(games):
    b = base64.b64encode(gzip.compress(g.encode("utf8"), 9, mtime=0)).decode()
    blocks += '<script type="text/plain" id="z%d">\n' % i + "\n".join(textwrap.wrap(b, 100)) + "\n</script>\n"
html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pangolin Rush Collection</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; }
  #ui { pointer-events: none; }
  #gw { display: none; position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 5; background: #000; }
  #gf { border: 0; width: 100%; height: 100%; display: block; }
  #back { position: absolute; left: 50%; top: 4px; transform: translateX(-50%); z-index: 6; font: bold 11px monospace; color: #fff;
    background: rgba(10, 8, 36, 0.6); border: 1px solid rgba(255, 210, 63, 0.7); border-radius: 4px; padding: 3px 10px; cursor: pointer; opacity: 0.55; }
  #back:hover { opacity: 1; }
</style>
</head>
<body>
<canvas id="gl" tabindex="0"></canvas>
<canvas id="ui"></canvas>
<div id="gw"><iframe id="gf" title="game" allow="autoplay"></iframe><button id="back">&#9664; RUSH ISLAND (Backspace)</button></div>
''' + blocks + '''<script>
''' + engine + chars + "\n" + dc + hub + '''})();
</script>
</body>
</html>
'''
open("pangolin-rush-collection.html", "w").write(html)
# a debug copy with a hook for headless tests
i = html.rindex("})();")
open("coll_dbg.html", "w").write(html[:i] + "  window.__dbg = function (c) { return eval(c); };\n" + html[i:])
print(len(html))
