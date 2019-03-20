#!/usr/bin/env python3

'''
Application for splitting groups from one SVG file into separate files

Usage:
python3 vector_layer_split.py infile format outdir

Usage Example:
python3 vector_layer_split.py vector_source.svg tw ../src/art/vector/layers/
'''

import lxml.etree as etree
import sys
import os
import copy
import re
import inkscape_svg_fixup

input_file = sys.argv[1]
output_format = sys.argv[2]
output_directory = sys.argv[3]
if not os.path.exists(output_directory):
    os.makedirs(output_directory)

ns = {
  'svg' : 'http://www.w3.org/2000/svg',
  'inkscape' : 'http://www.inkscape.org/namespaces/inkscape',
  'sodipodi':"http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd",
}

tree = etree.parse(input_file)
inkscape_svg_fixup.fix(tree)

# prepare output template
template = copy.deepcopy(tree)
root = template.getroot()

# remove all svg root attributes except document size
for a in root.attrib:
  if (a != "viewBox"):
    del root.attrib[a]

# add placeholder for CSS class (needed for workaround for non HTML 5.1 compliant browser)
if output_format == 'tw':
  root.attrib["class"] = "'+_art_display_class+'"

# remove all content, including metadata
# for twine output, style definitions are removed, too
defs = None
for e in root:
  if (e.tag == etree.QName(ns['svg'], 'defs')):
    defs = e
  if (e.tag == etree.QName(ns['svg'], 'g') or
      e.tag == etree.QName(ns['svg'], 'metadata') or
      e.tag == etree.QName(ns['svg'], 'defs') or
      e.tag == etree.QName(ns['sodipodi'], 'namedview') or
      (output_format == 'tw' and e.tag == etree.QName(ns['svg'], 'style'))
      ):
    root.remove(e)
# template preparation finished

# prepare regex for later use
regex_xmlns = re.compile(' xmlns[^ ]+',)
regex_space = re.compile('[>][ ]+[<]',)

# find all groups
layers = tree.xpath('//svg:g',namespaces=ns)
for layer in layers:
  i = layer.get('id')
  if ( # disregard non-content groups
    i.endswith("_") or # manually suppressed with underscore
    i.startswith("XMLID") or # Illustrator generated group 
    i.startswith("g") # Inkscape generated group
  ):
    continue
  # create new canvas
  output = copy.deepcopy(template)
  # copy all shapes into template
  canvas = output.getroot()
  for e in layer:
    canvas.append(e)
  # represent template as SVG (binary string)
  svg = etree.tostring(output, pretty_print=False)
  # poor man's conditional defs insertion
  # TODO: extract only referenced defs (filters, gradients, ...)
  # TODO: detect necessity by traversing the elements. do not stupidly search in the string representation
  if ("filter:" in svg.decode('utf-8')):
    # it seems there is a filter referenced in the generated SVG, re-insert defs from main document
    canvas.insert(0,defs)
    # re-generate output
    svg = etree.tostring(output, pretty_print=False)
  
  if (output_format == 'tw'):
    # remove unnecessary attributes
    # TODO: never generate unnecessary attributes in the first place
    svg = svg.decode('utf-8')
    svg = regex_xmlns.sub('',svg)
    svg = svg.replace(' inkscape:connector-curvature="0"','') # this just saves space
    svg = svg.replace('\n','').replace('\r','') # print cannot be multi-line
    svg = regex_space.sub('><',svg) # remove indentaion
    svg = svg.replace('svg:','') # svg namespace was removed
    svg = svg.replace('<g ','<g transform="\'+_art_transform+\'"') # internal groups are used for scaling
    svg = svg.encode('utf-8')
  
  # save SVG string to file
  i = layer.get('id')
  output_path = os.path.join(output_directory,i+'.'+output_format)
  with open(output_path, 'wb') as f:
    if (output_format == 'svg'):
      # Header for normal SVG (XML)
      f.write('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'.encode("utf-8"))
      f.write(svg)
    elif (output_format == 'tw'):
      # Header for SVG in Twine file (SugarCube print statement)
      f.write((':: Art_Vector_%s [nobr]\n\n'%(i)).encode("utf-8"))
      f.write("<<print '<html>".encode("utf-8"))
      f.write(svg)
      f.write("</html>' >>".encode("utf-8"))
