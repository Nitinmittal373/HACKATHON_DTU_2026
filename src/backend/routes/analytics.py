from flask import Blueprint, jsonify, request
from utils.calculations import (
    calc_concentration, calc_reliance,
    calc_perseverance, calc_confidence, calc_character
)

bp = Blueprint('analytics', __name__, url_prefix='/api')


@bp.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@bp.route('/student/<student_id>/scores', methods=['POST'])
def compute_scores(student_id):
    """
    Accepts session data and returns all five scores.

    Body (JSON):
      {
        "today":       { focusSeconds, totalSeconds, tabSwitches, correctStreak },
        "week":        { tasksAttempted, tasksNoHint, hintsThisWeek, hintsLastWeek },
        "retries":     { retriedCount, eventualSuccess, avgRetries },
        "calibration": [ { rated, actual }, ... ]
      }
    """
    body = request.get_json(force=True) or {}

    conc = calc_concentration(body.get('today', {}))
    rel  = calc_reliance(body.get('week', {}))
    pers = calc_perseverance(body.get('retries', {}))
    conf = calc_confidence(body.get('calibration', []))
    char = calc_character(conc['total'], rel['total'], pers['total'], conf['total'])

    return jsonify({
        'studentId': student_id,
        'scores': {
            'concentration': conc,
            'reliance':      rel,
            'perseverance':  pers,
            'confidence':    conf,
            'character':     char,
        }
    })
