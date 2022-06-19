
$('#checkout-form').submit((e)=>{
  e.preventDefault()
  $.ajax({
    url:'/place-order',
    method: 'post',
    data: $('#checkout-form').serialize(),
    success: (response)=>{
      alert("ORDER PLACED")    
      location.href='/order-complete'
    }
  })
})