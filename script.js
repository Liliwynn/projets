document.addEventListener("DOMContentLoaded", function() {
  let selectedCriteria = [];
  let orderedCriteria = [];

  // Rendre nextStep disponible globalement
  window.nextStep = function() {
    const currentStep = document.querySelector('.step.active');
    if (currentStep) {
      currentStep.classList.remove('active');
      const nextStep = currentStep.nextElementSibling;
      if (nextStep) {
        nextStep.classList.add('active');
        console.log('Next step:', nextStep.id);  // Debug : Afficher l'étape suivante
      } else {
        console.log('No more steps. End of the form.');
      }
    } else {
      console.error('No active step found.');
    }
  }

  window.selectCriteria = function() {
    selectedCriteria = Array.from(document.querySelectorAll('#criteriaForm input:checked')).map(checkbox => checkbox.value);
    console.log('Selected criteria:', selectedCriteria);  // Debug : Afficher les critères sélectionnés
    if (selectedCriteria.length === 0) {
      alert("Veuillez sélectionner au moins un critère.");
      return;
    }
    displayCriteriaInNextSteps();
    nextStep();
  }

  function displayCriteriaInNextSteps() {
    const ordinalRanking = document.getElementById('ordinalRanking');
    ordinalRanking.innerHTML = '';

    selectedCriteria.forEach((criteria) => {
      ordinalRanking.innerHTML += `<div>${criteria}: <select class="ordinal-select">
                                      ${generateOrdinalOptions()}
                                    </select></div>`;
    });
  }

  function generateOrdinalOptions() {
    let options = "";
    for (let i = 1; i <= selectedCriteria.length; i++) {
      options += `<option value="${i}">${i}</option>`;
    }
    return options;
  }

  window.validateOrdinalRanking = function() {
    const ordinalSelections = Array.from(document.querySelectorAll('.ordinal-select'));
    const selectedValues = ordinalSelections.map(select => parseInt(select.value));

    const hasDuplicates = new Set(selectedValues).size !== selectedValues.length;
    console.log('Ordinal ranking values:', selectedValues);  // Debug : Afficher l'importance sélectionnée

    if (hasDuplicates) {
      alert("Veuillez attribuer des valeurs d'importance uniques.");
      return;
    }

    orderedCriteria = selectedCriteria.map((criteria, index) => ({
      criteria,
      importance: selectedValues[index]
    }));

    orderedCriteria.sort((a, b) => a.importance - b.importance);
    console.log('Ordered criteria after ranking:', orderedCriteria);  // Debug : Afficher les critères classés

    assignCardinalValues();
    nextStep();
  }

  function assignCardinalValues() {
    const cardinalWeighting = document.getElementById('cardinalWeighting');
    cardinalWeighting.innerHTML = '';

    orderedCriteria.forEach((item, index) => {
      const value = (index === 0) ? 10 : (index === orderedCriteria.length - 1) ? 1 : ''; 
      cardinalWeighting.innerHTML += `<div>${item.criteria}: 
        <input type="number" class="cardinal-input" value="${value}" min="2" max="9" ${value !== '' ? 'readonly' : ''}></div>`;
    });

    displayProjectRating();
  }

  function displayProjectRating() {
    const projectRating = document.getElementById('projectRating');
    projectRating.innerHTML = '';

    orderedCriteria.forEach(item => {
      projectRating.innerHTML += `<div>${item.criteria}: 
      <input type="number" max="10" min="0" value="0"></div>`;
    });
  }

  window.calculateIndividualScore = function() {
    const weights = Array.from(document.querySelectorAll('.cardinal-input')).map(input => parseInt(input.value));
    const ratings = Array.from(document.querySelectorAll('#projectRating input')).map(input => parseInt(input.value));
    console.log('Weights:', weights);  // Debug : Afficher les pondérations
    console.log('Ratings:', ratings);  // Debug : Afficher les notes

    if (weights.some(isNaN) || ratings.some(isNaN)) {
      alert("Veuillez attribuer une pondération et une note de performance pour chaque critère.");
      return;
    }

    let individualScore = 0;
    const scoreResults = [];

    for (let i = 0; i < weights.length; i++) {
      const score = weights[i] * ratings[i];
      individualScore += score;
      scoreResults.push({ criteria: orderedCriteria[i].criteria, score: score });
    }

    console.log('Score results:', scoreResults);  // Debug : Afficher les résultats des scores

    if (scoreResults.length > 0) {
      document.getElementById('scoreList').innerHTML = scoreResults
        .map(result => `<li>${result.criteria} : ${result.score}/100</li>`)
        .join("");

      document.getElementById('individualScore').dataset.score = individualScore;
      console.log('Individual total score:', individualScore);  // Debug : Afficher le score total

      nextStep();
    } else {
      alert("Aucun critère n'a été évalué.");
    }
  }

  window.calculateFinalScore = function() {
    const individualScore = parseInt(document.getElementById('individualScore').dataset.score);
    const maxPossibleScore = orderedCriteria.length * 100;
    const finalScore = (individualScore / maxPossibleScore) * 100;
    console.log('Final score:', finalScore);  // Debug : Afficher le score final calculé

    document.getElementById('finalScore').innerText = `Score total du projet : ${finalScore.toFixed(2)}/100`;
    nextStep();
  }

  window.calculateProjectValue = function() {
    const participantScores = Array.from(document.querySelectorAll('.participant-score')).map(input => parseInt(input.value));

    if (participantScores.some(isNaN)) {
      alert('Veuillez entrer des scores valides pour tous les participants.');
      return;
    }

    const totalScore = participantScores.reduce((a, b) => a + b, 0);
    const averageScore = totalScore / participantScores.length;
    console.log('Average score of participants:', averageScore);  // Debug : Afficher la moyenne des scores

    document.getElementById('finalScore').innerText = `Score final du projet : ${averageScore.toFixed(2)}/100`;

    evaluateProjectAcceptability(averageScore);
  }

  function evaluateProjectAcceptability(averageScore) {
    const resultElement = document.getElementById('acceptabilityResult');
    resultElement.innerHTML = '';
    resultElement.classList.remove('green', 'yellow', 'orange', 'red');

    if (averageScore >= 80) {
      resultElement.innerHTML = 'Projet acceptable tel que présenté';
      resultElement.classList.add('green');
    } else if (averageScore >= 60) {
      resultElement.innerHTML = 'Projet acceptable avec des modifications mineures ou conditions de réalisation mentionnées';
      resultElement.classList.add('yellow');
    } else if (averageScore >= 50) {
      resultElement.innerHTML = 'Projet acceptable avec des modifications majeures ou les conditions de réalisation mentionnées';
      resultElement.classList.add('orange');
    } else {
      resultElement.innerHTML = 'Projet inacceptable car il ne satisfait pas les critères mentionnés en annexe';
      resultElement.classList.add('red');
    }

    nextStep();
  }
});
