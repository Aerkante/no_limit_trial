import type { HttpContext } from '@adonisjs/core/http'
import { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import { VineValidator } from '@vinejs/vine'

export default abstract class AbstractController {
  protected model: LucidModel
  protected postValidator?: VineValidator<any, any>
  protected putValidator?: VineValidator<any, any>
  protected deleteValidator?: VineValidator<any, any>
  protected getUniqueValidator?: VineValidator<any, any>
  protected getListValidator?: VineValidator<any, any>

  constructor(
    model: LucidModel,
    postValidator?: VineValidator<any, any>,
    putValidator?: VineValidator<any, any>,
    deleteValidator?: VineValidator<any, any>,
    getUniqueValidator?: VineValidator<any, any>,
    getListValidator?: VineValidator<any, any>
  ) {
    this.model = model
    this.postValidator = postValidator
    this.putValidator = putValidator
    this.deleteValidator = deleteValidator
    this.getUniqueValidator = getUniqueValidator
    this.getListValidator = getListValidator
  }

  private applySearch(query: any, search?: string, field: string = 'name') {
    if (search) {
      query.where(field, 'ilike', `%${search}%`)
    }
  }

  private applyFilter(query: any, filters?: { filters: string }) {
    if (filters?.filters) {
      const data = filters.filters.split(';')
      data.forEach((item) => {
        const [key, value] = item.split('=')
        query.where(key, value)
      })
    }
  }

  private applySort(query: any, sort?: string) {
    if (!sort) return query

    const direction = sort.startsWith('-') ? 'desc' : 'asc'
    const column = sort.startsWith('-') ? sort.slice(1) : sort
    if (column === 'all') {
      query.orderBy('id', direction)
      return query
    }

    query.orderBy(column, direction)
    return query
  }

  private applyRelations(query: any, relations?: string) {
    if (!relations) return query

    const applyNestedPreload = (queryBuilder: any, relationParts: string[]) => {
      if (relationParts.length === 0) return

      const currentRelation = relationParts[0]
      const remainingRelations = relationParts.slice(1)

      const [relationName, fields] = currentRelation.split(':')
      const selectedFields = fields ? fields.split(';') : undefined

      if (remainingRelations.length > 0) {
        queryBuilder.preload(relationName, (queryPivot: any) => {
          if (selectedFields) {
            queryPivot.select(selectedFields)
          }
          applyNestedPreload(queryPivot, remainingRelations)
        })
      } else {
        queryBuilder.preload(relationName, (queryPivot: any) => {
          if (selectedFields) {
            queryPivot.select(selectedFields)
          }
        })
      }
    }

    const relationsList = relations.split(',')
    const groupedRelations = new Map<string, string[]>()

    // Group relations by their base name
    relationsList.forEach((relation) => {
      const relationParts = relation.split('@')
      if (relationParts.length > 1) {
        const baseRelation = relationParts[0]
        const nestedRelation = relationParts[1]
        if (!groupedRelations.has(baseRelation)) {
          groupedRelations.set(baseRelation, [])
        }
        groupedRelations.get(baseRelation)?.push(nestedRelation)
      } else {
        query.preload(relationParts[0])
      }
    })

    // Apply grouped relations
    groupedRelations.forEach((nestedRelations, baseRelation) => {
      query.preload(baseRelation, (queryPivot: any) => {
        nestedRelations.forEach((nestedRelation) => {
          queryPivot.preload(nestedRelation)
        })
      })
    })

    return query
  }

  async index({ request }: HttpContext) {
    let filters: any = {}
    if (this.getListValidator) {
      filters = await request.validateUsing(this.getListValidator)
    } else {
      filters = request.body()
    }
    const page = request.input(filters.page, 1)
    const limit = request.input(filters.limit, 10)
    let relations = request.input('relations')
    if (Array.isArray(relations)) {
      relations = relations.join(',')
    }

    const query = this.model.query()
    this.applyRelations(query, relations)
    this.applySearch(query, filters.search, filters.search_field)
    this.applyFilter(query, filters.filters)
    this.applySort(query, filters.sort)

    return await query.paginate(page, limit)
  }

  async store({ request }: HttpContext): Promise<LucidRow> {
    let data: any
    if (this.postValidator) {
      data = await request.validateUsing(this.postValidator)
    } else {
      data = request.all()
    }

    const model = await this.model.create(data)
    return model
  }

  async show({ params, request }: HttpContext) {
    let relations = request.input('relations')
    if (Array.isArray(relations)) {
      relations = relations.join(',')
    }
    const query = this.model.query()
    this.applyRelations(query, relations)
    return await query.where('id', params.id).firstOrFail()
  }

  async update({ params, request }: HttpContext): Promise<LucidRow> {
    const model = await this.model.findOrFail(params.id)
    let data: any
    if (this.putValidator) {
      data = await request.validateUsing(this.putValidator)
    } else {
      data = request.all()
    }

    await model.merge(data).save()
    return model
  }

  async destroy({ params }: HttpContext) {
    const model = await this.model.findOrFail(params.id)
    await model.delete()

    return { message: 'Record deleted successfully' }
  }

  async simpleList({ request }: HttpContext) {
    let filters: any = {}
    if (this.getListValidator) {
      filters = await request.validateUsing(this.getListValidator)
    } else {
      filters = request.body()
    }
    let relations = request.input('relations')
    if (Array.isArray(relations)) {
      relations = relations.join(',')
    }
    const query = this.model.query()
    this.applyRelations(query, relations)
    this.applyFilter(query, filters)
    this.applySort(query, filters.sort)
    return await query
  }

  async updateOrder({ request }: HttpContext) {
    if (this.model.$hasColumn('order')) {
      const data = request.body()
      const orders = data as { id: number; order: number }[]
      for (const order of orders) {
        const model = (await this.model.findOrFail(order.id)) as LucidRow & { order: number }
        model.order = order.order
        await model.save()
      }
      return { message: 'Order updated successfully' }
    }
    return { message: 'Model does not have an order column' }
  }
}
