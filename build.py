#!/usr/bin/env python3
"""Genera index.html (un solo fichero, sin dependencias) a partir de src/. Uso: python3 build.py"""
import pathlib, re
R = pathlib.Path(__file__).resolve().parent; S = R / 'src'
h = (S / 'index.template.html').read_text()
parts = {'PROFILES': 'profiles.js', 'AUDIO': 'audio.js', 'ART': 'art-libs.js', 'PROBLEMS': 'problems.js', 'SPRITES': 'sprites.js',
         'DATA': 'data.js', 'GAME': 'game.js', 'SCENE': 'scene.js', 'UI': 'ui.js', 'PWA': 'pwa.js'}
for k, f in parts.items():
    tag = f'//@@{k}@@'; assert tag in h, tag
    h = h.replace(tag, (S / f).read_text())
(R / 'index.html').write_text(h)
print('index.html', len(h), 'bytes')
