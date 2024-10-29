document.addEventListener("DOMContentLoaded", function() {
  let selectedCriteria = [];
  let orderedCriteria = [];
  let scoreResults = [];
  let currentStepIndex = 0;

  const steps = document.querySelectorAll(".step");

  function updateStepDisplay() {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStepIndex);
    });
  }

  window.nextStep = function() {
    if (currentStepIndex < steps.length - 1) {
      currentStepIndex++;
      updateStepDisplay();
      console.log('Next step:', steps[currentStepIndex].id);
    }
  }

  window.prevStep = function() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      updateStepDisplay();
      console.log('Previous step:', steps[currentStepIndex].id);
    }
  }

  window.selectCriteria = function() {
    selectedCriteria = Array.from(document.querySelectorAll('#criteriaForm input:checked')).map(checkbox => checkbox.value);
    console.log('Selected criteria:', selectedCriteria);
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
    console.log('Ordinal ranking values:', selectedValues);

    if (hasDuplicates) {
      alert("Veuillez attribuer des valeurs d'importance uniques.");
      return;
    }

    orderedCriteria = selectedCriteria.map((criteria, index) => ({
      criteria,
      importance: selectedValues[index]
    }));

    orderedCriteria.sort((a, b) => a.importance - b.importance);
    console.log('Ordered criteria after ranking:', orderedCriteria);

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
      <input type="number" max="10" min="0" value="5"></div>`;
    });
  }

  window.calculateIndividualScore = function() {
    const weights = Array.from(document.querySelectorAll('.cardinal-input')).map(input => parseInt(input.value));
    const ratings = Array.from(document.querySelectorAll('#projectRating input')).map(input => parseInt(input.value));
    console.log('Weights:', weights);
    console.log('Ratings:', ratings);

    if (weights.some(isNaN) || ratings.some(isNaN)) {
      alert("Veuillez attribuer une pondération et une note de performance pour chaque critère.");
      return;
    }

    let individualScore = 0;
    scoreResults = [];

    for (let i = 0; i < weights.length; i++) {
      const score = weights[i] * ratings[i];
      individualScore += score;
      scoreResults.push({ criteria: orderedCriteria[i].criteria, score: score, weight: weights[i], rating: ratings[i] });
    }

    console.log('Score results:', scoreResults);

    if (scoreResults.length > 0) {
      document.getElementById('scoreList').innerHTML = scoreResults
        .map(result => `<li>${result.criteria} : ${result.weight} * ${result.rating} = ${result.score} points</li>`)
        .join("");

      document.getElementById('individualScore').dataset.score = individualScore;
      console.log('Individual total score:', individualScore);

      nextStep();
    } else {
      alert("Aucun critère n'a été évalué.");
    }
  }

  window.calculateFinalScore = function() {
    const individualScore = parseInt(document.getElementById('individualScore').dataset.score);
    const numberOfCriteria = orderedCriteria.length;
    const maxPossibleScore = numberOfCriteria * 100;

    const finalPercentage = (individualScore / maxPossibleScore) * 100;

    console.log('Max possible score:', maxPossibleScore);
    console.log('Final percentage:', finalPercentage);

    document.getElementById('finalScore').innerHTML = 
      `Score : ${individualScore} points sur un maximum potentiel de ${maxPossibleScore} points<br>
       Pourcentage : ${finalPercentage.toFixed(2)}%`;

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
    console.log('Average score of participants:', averageScore);

    document.getElementById('finalScore').innerText = `Score final du projet : ${averageScore.toFixed(2)} points`;

    evaluateProjectAcceptability(averageScore);
    nextStep();
  }

  function evaluateProjectAcceptability(averageScore) {
    const resultElement = document.getElementById('acceptabilityResult');
    resultElement.innerHTML = ''; // Vide le contenu précédent
    resultElement.classList.remove('highlighted');

    const recommendations = [
      { text: 'Projet acceptable tel que présenté', class: 'green', threshold: 80 },
      { text: 'Projet acceptable avec des modifications mineures ou conditions de réalisation mentionnées', class: 'yellow', threshold: 60 },
      { text: 'Projet acceptable avec des modifications majeures ou les conditions de réalisation mentionnées', class: 'orange', threshold: 50 },
      { text: 'Projet inacceptable car il ne satisfait pas les critères mentionnés en annexe', class: 'red', threshold: 0 }
    ];

    // Affiche chaque recommandation comme un div ou un p
    recommendations.forEach(rec => {
      const item = document.createElement("div"); // Remplace <li> par <div> pour éviter le point
      item.textContent = rec.text;
      item.classList.add(rec.class);
      
      if (averageScore >= rec.threshold && !resultElement.querySelector(".highlighted")) {
        item.classList.add("highlighted");
      }

      resultElement.appendChild(item);
    });
    nextStep();
}
});
