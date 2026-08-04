#!/usr/bin/env python3
"""
Regenerate the intro's handwriting SVGs.

The intro letters are NOT live text — they're real Dancing Script outlines baked
into index.html as SVG paths. That's what lets the pen sit on the true curve of
each letter (via getPointAtLength) instead of sliding along a straight wipe.

Only needed if the intro wording or font changes.

    pip install --target ./pylibs fonttools uharfbuzz
    curl -sSL -o ds.ttf \
      "https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf"
    PYTHONPATH=./pylibs python3 tools/generate-handwriting.py ds.ttf

Prints the two <svg> blocks; paste them into the .intro__line divs in index.html.
"""
import re
import sys

import uharfbuzz as hb
from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

WEIGHT = 600
LINES = [("name", "Steven Howard,"), ("role", "writing and publishing coach")]


def main(font_path):
    ft = TTFont(font_path)
    ft = instantiateVariableFont(ft, {"wght": WEIGHT}, inplace=True,
                                 updateFontNames=False)
    glyphset = ft.getGlyphSet()
    order = ft.getGlyphOrder()
    ymin, ymax = ft["head"].yMin, ft["head"].yMax

    # HarfBuzz for shaping, so script connections and kerning are correct.
    with open(font_path, "rb") as f:
        hbfont = hb.Font(hb.Face(hb.Blob(f.read())))
    try:
        hbfont.set_variations({"wght": WEIGHT})
    except Exception:
        pass

    def shape(text):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(hbfont, buf)

        paths, x = [], 0.0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            spen = SVGPathPen(glyphset)
            # fonts are y-up, SVG is y-down
            glyphset[order[info.codepoint]].draw(
                TransformPen(spen, Transform(1, 0, 0, -1,
                                             x + pos.x_offset, -pos.y_offset))
            )
            d = spen.getCommands()
            if d.strip():
                # integers are plenty precise at upem 1000, and ~75% smaller
                paths.append(re.sub(r"-?\d+\.\d+",
                                    lambda m: str(round(float(m.group()))), d))
            x += pos.x_advance
        return paths, x

    for key, text in LINES:
        paths, width = shape(text)
        defs, uses = [], []
        for i, d in enumerate(paths):
            gid = f"{key[0]}{i}"
            defs.append(f'<path id="{gid}" d="{d}"/>')
            defs.append(f'<clipPath id="c{gid}"><use href="#{gid}"/></clipPath>')
            uses.append(f'<g clip-path="url(#c{gid})">'
                        f'<use class="ink" href="#{gid}"/></g>')

        print(
            f'<svg class="hw hw--{key}" viewBox="0 {-ymax} {round(width)} '
            f'{round(ymax - ymin)}" data-w="{round(width)}" '
            f'data-h="{round(ymax - ymin)}" aria-hidden="true" '
            f'preserveAspectRatio="xMinYMid meet">'
            f'<defs>{"".join(defs)}</defs>{"".join(uses)}</svg>'
        )
        print(file=sys.stderr)
        print(f"{key}: {len(paths)} glyphs, {round(width)} units advance",
              file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "ds.ttf")
